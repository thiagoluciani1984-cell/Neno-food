# Neno Food — mapa mestre da plataforma

## Norte do produto

Construir uma plataforma multi-tenant confiável para descoberta, venda, operação e entrega de alimentos, com isolamento forte entre restaurantes, experiência simples para o cliente e governança central da plataforma.

## Estado-base da Fase 0

- Produto transacional já funcional em boa parte do happy path.
- Quatro experiências: cliente, restaurante/staff, entregador e administração.
- Supabase concentra identidade, dados, autorização, arquivos e Realtime.
- Asaas concentra pagamento online; Vercel é o destino de deploy previsto.
- Estoque e insumos são extensões operacionais recentes.
- ERP, CRM e IA não fazem parte desta execução e permanecem como hipóteses futuras.

## Mapa mestre

```text
Aquisição e descoberta
  Marketplace ─ busca ─ feed ─ promoções/favoritos
       │
Conversão
  Loja ─ catálogo/opções ─ carrinho ─ cupom ─ checkout
       │
Transação
  Pedido ─ pagamento Asaas/offline ─ status ─ notificação
       │
Operação do restaurante
  KDS ─ preparo ─ impressão ─ estoque ─ insumos ─ relatórios
       │
Fulfillment
  Pool driver ─ aceite ─ GPS/rota ─ PIN ─ entrega ─ avaliação
       │
Governança
  Admin ─ aprovação ─ moderação ─ métricas ─ segurança/LGPD

Fundação transversal
  Auth + RLS + multi-tenant + Storage + Realtime + observabilidade
```

## Capacidades por superfície

### Cliente

Descoberta, cardápio, opções, carrinho, checkout convidado/autenticado, PIX e pagamento na entrega, rastreamento, conta, endereços, favoritos e avaliações.

### Restaurante

Onboarding, perfil, horários/configurações, catálogo, pedidos/KDS, cupons, clientes, relatórios, equipe, posts, biblioteca de mídia, estoque e insumos.

### Entregador

Cadastro, documentos/veículo, aprovação, disponibilidade, pool de pedidos, aceite, rota/localização e conclusão por PIN.

### Plataforma

Aprovação e bloqueio, moderação, métricas, políticas multi-tenant, rate limit e integrações. Suporte, refunds e auditoria ainda carecem de produto completo.

## Princípios arquiteturais

1. RLS e autorização server-side são a fronteira de segurança.
2. Toda operação carrega tenant e ator explícitos; service role nunca substitui autorização.
3. Valores monetários permanecem inteiros em centavos e são resolvidos no servidor.
4. Pagamento e transição de pedido devem ser idempotentes e auditáveis.
5. Tipos devem ser derivados/validados contra o schema real.
6. Fluxos críticos precisam de testes ponta a ponta e de concorrência.
7. Dados pessoais são minimizados, retidos por prazo e acessados por necessidade.
8. Funcionalidades novas só avançam após critérios mensuráveis de segurança e operação.

## Trilhas de trabalho

| Trilha | Objetivo | Indicador de prontidão |
|---|---|---|
| Segurança multi-tenant | Eliminar bypass e drift de permissão | Suite RLS e auth 100% verde |
| Receita | Compra/pagamento robustos | Taxa de sucesso e reconciliação mensuradas |
| Operação restaurante | Pedido até preparo previsível | SLA e falhas de KDS monitorados |
| Logística | Entrega rastreável e segura | Aceite, localização e PIN homologados |
| Dados/plataforma | Schema confiável e observável | Migrations reproduzíveis e logs correlacionados |
| LGPD | Governança do ciclo de dados | Inventário, retenção e direitos do titular operacionais |
| Qualidade | Regressão rápida e confiável | CI cobrindo unit, integration, RLS, E2E e build |

## Critérios para sair da fundação

- P0 de segurança resolvidos.
- Banco reconstruído do zero por CI e comparado ao Cloud.
- Compra PIX e pagamento na entrega testados ponta a ponta.
- Autorização de cliente, staff, restaurant, driver, moderator e master validada.
- Observabilidade mínima de webhook, criação de pedido e transições.
- Runbooks de deploy, rollback, incidente e restauração disponíveis.

## Exclusões atuais

Não implementar nesta etapa: contabilidade/fiscal/compras de um ERP, automação comercial de CRM, recomendação ou copilotos de IA. O roadmap preserva essas ideias apenas como horizonte condicionado a dados, governança e product-market fit.

## Documentos de apoio

- `CURRENT_STATE_AUDIT.md`: evidências do repositório.
- `FEATURE_MATRIX.md`: maturidade por capacidade.
- `DATABASE_MAP.md`: schema, RLS e riscos de dados.
- `PERSONAS_AND_PERMISSIONS.md`: atores e acesso.
- `SECURITY_AND_LGPD.md`: hardening e privacidade.
- `TECHNICAL_DEBT.md`: dívida priorizada.
- `PRODUCT_ROADMAP.md`: sequência de evolução.
- `FIRST_SPRINT.md`: backlog executável inicial.
