# Mapa do banco de dados

## Visão geral

- PostgreSQL gerenciado pelo Supabase.
- 47 migrations sequenciais (`0001`–`0047`).
- 50 tabelas públicas identificadas nas migrations.
- RLS habilitado nas tabelas de aplicação; Storage possui policies próprias.
- Realtime configurado para pedidos, notificações e entidades de entrega.
- Tipos TypeScript são mantidos manualmente em `src/types/database.types.ts`.
- `supabase/full_setup.sql` é artefato gerado e pode estar defasado; migrations são a fonte de verdade.

## Domínios e tabelas

| Domínio | Tabelas | Papel |
|---|---|---|
| Identidade | `roles`, `profiles` | Papel, vínculo principal e dados públicos do usuário |
| Restaurante | `restaurants`, `restaurant_settings`, `restaurant_staff`, `restaurant_documents`, `restaurant_followers` | Tenant, operação, equipe e onboarding |
| Catálogo | `categories`, `products`, `product_images`, `product_options`, `product_option_items`, `image_library` | Cardápio, adicionais e mídia |
| Cliente | `customers`, `addresses`, `favorites`, `restaurant_favorites`, `reviews`, `launch_wheel_spins` | Perfil comercial, endereços, preferências e aquisição |
| Pedido | `orders`, `order_items`, `order_item_options`, `order_status_history` | Transação e snapshots de venda |
| Pagamento | `payments`, `coupons`, `coupon_usage`, `refunds` | Cobrança, descontos e devoluções |
| Entrega | `drivers`, `driver_documents`, `driver_vehicles`, `driver_verifications`, `driver_locations`, `delivery_tracking`, `delivery_codes` | Entregador, rastreamento e prova de entrega |
| Social | `posts`, `post_images`, `post_likes`, `post_comments`, `post_saves`, `post_reports` | Feed, interação e moderação |
| Plataforma | `notifications`, `audit_logs`, `support_tickets`, `ticket_messages`, `rate_limit_hits` | Comunicação, governança e segurança |
| Insumos | `supply_items`, `supply_entries` | Ledger de retiradas/compras e aprovação |
| Estoque | `stock_items`, `stock_movements`, `stock_recipes` | Saldo, custo e ficha técnica |

## Relações centrais

```text
auth.users
  └─ profiles ──┬─ customers ── addresses
                ├─ drivers ── vehicles/documents/locations
                └─ restaurant_staff ── restaurants

restaurants
  ├─ restaurant_settings
  ├─ categories ── products ── product_options ── product_option_items
  ├─ orders ── order_items ── order_item_options
  │    ├─ payments / refunds
  │    ├─ order_status_history
  │    └─ delivery_tracking / delivery_codes
  ├─ posts ── images/likes/comments/saves/reports
  ├─ supply_items ── supply_entries
  └─ stock_items ── stock_movements / stock_recipes
```

## Evolução das migrations

| Faixa | Conteúdo |
|---|---|
| 0001–0010 | Enums, core, catálogo, clientes, pedidos, índices, funções, RLS, Storage e Realtime |
| 0011–0019 | Onboarding, social, driver, tracking, opções, ferramentas admin, RLS/índices estendidos |
| 0020–0032 | Favoritos, onboarding driver, pagamentos históricos, convidado, claim, PIN, preparo e tema |
| 0033–0043 | Asaas, taxa, roleta, cupons, autoaceite, concorrência, horários, tipos, proteção e rate limit |
| 0044–0047 | Insumos, estoque, fechamento de lote e aprovação por pares |

## Funções e triggers importantes

| Objeto | Responsabilidade |
|---|---|
| `handle_new_user` | Cria perfil/customer após signup |
| `handle_new_driver` | Cria registro de driver |
| `current_role`, `is_master_admin`, `current_restaurant_id`, `is_restaurant_staff` | Contexto para RLS |
| `recalc_order_totals` | Recalcula totais do pedido |
| `record_order_status_change` | Histórico de transição |
| contadores de posts | Sincroniza likes/comments/saves |
| `auto_confirm_order` | Confirma pedidos conforme configuração |
| `adjust_coupon_usage` | Ajuste atômico do contador |
| `enforce_max_active_orders` | Limite de entregas ativas |
| `check_rate_limit` | Contador transacional de chamadas |
| `protect_restaurant_status_columns` | Impede elevação de status pelo tenant |
| `protect_supply_entry_status` | Controla aprovação por pares |
| `apply_stock_movement` | Atualiza saldo de estoque |
| `stock_deduct_for_order` | Baixa por ficha técnica/venda |
| `stock_entry_from_supply` | Entrada originada em insumo aprovado |
| `close_supply_batch` | Marca lançamentos aprovados como pagos |

## Mapa de RLS

| Grupo | Leitura | Escrita |
|---|---|---|
| Catálogo público | Dados ativos são públicos | Tenant/staff/master |
| Perfil/restaurante | Próprio, tenant ou master conforme entidade | Próprio/tenant/master; status protegido por trigger |
| Cliente | Próprio | Próprio |
| Pedidos | Cliente, restaurante, driver atribuído/pool e master | Criação autorizada; transições conforme papel/policy |
| Pagamentos/cupons | Pedido/tenant/master; cupom público limitado | Serviço/tenant/master conforme operação |
| Social | Posts publicados públicos | Autor/tenant; moderação master |
| Driver/entrega | Driver próprio, pedido relacionado, tenant/master | Driver e papéis operacionais conforme entidade |
| Documentos | Dono/tenant/master; arquivos privados por signed URL | Dono/tenant; revisão administrativa |
| Admin/suporte | Participantes e admin | Participantes/admin conforme tabela |
| Insumos/estoque | Tenant/staff/master | Tenant/staff/master, com triggers de integridade |
| Rate limit | Sem policy para clientes | Função `SECURITY DEFINER` |

As migrations `0008` e `0018` concentram as policies base; migrations posteriores adicionam exceções e correções. A segurança efetiva deve ser testada no banco resultante, pois revisar arquivos isolados não detecta drift ou migration ausente em produção.

## Storage

- Buckets para imagens públicas de produtos e biblioteca.
- Buckets privados para documentos de restaurante/driver, planejados para signed URLs via servidor.
- Confirmar MIME, tamanho máximo, prefixo por tenant, expiração de signed URL e remoção de metadados EXIF.

## Riscos de dados

1. Interfaces TypeScript manuais podem divergir das 47 migrations.
2. Não há teste automatizado que aplique todas as migrations em banco vazio e exercite RLS.
3. `full_setup.sql`, README e scripts têm referências históricas desatualizadas.
4. Agregados (`total_orders`, `total_spent`, ratings, contadores sociais) exigem verificação de consistência/rebuild.
5. Dados pessoais sensíveis de entregadores e endereços exigem política de retenção, acesso e auditoria.
6. Tokens de convidados permitem acesso delegado e precisam de ciclo de vida explícito.
7. Migrations recentes de insumos/estoque dependem de triggers; falhas concorrentes devem ser testadas no PostgreSQL real.

## Próxima verificação obrigatória

Criar um pipeline descartável que aplique `0001`–`0047`, compare tipos gerados, execute testes de RLS para cada persona e confirme que o schema Cloud tem exatamente as mesmas migrations.
