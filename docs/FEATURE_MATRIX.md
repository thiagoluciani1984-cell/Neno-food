# Matriz de funcionalidades

Legenda: **Completa** = fluxo principal implementado; **Parcial** = implementação útil, mas com lacunas relevantes; **Ausente** = sem fluxo de produto; **Infra** = modelado apenas ou majoritariamente no banco.

| Área | Capacidade | Estado | Evidência/lacuna principal |
|---|---|---:|---|
| Auth | Login, logout e sessão | Completa | Supabase Auth, middleware e Server Actions |
| Auth | Cadastro de cliente | Completa | Perfil/customer via trigger |
| Auth | Recuperação de senha | Completa | Fluxo request/callback/reset |
| Auth | OAuth | Parcial | UI/callback existem; configuração externa não auditada |
| Auth | MFA e gestão de sessões | Ausente | Sem fluxo dedicado |
| Restaurante | Cadastro e onboarding em 4 etapas | Completa | Wizard, persistência e aprovação |
| Restaurante | Gestão de perfil e tema | Completa | Logo, capa, dados e cores |
| Restaurante | Multi-restaurante | Parcial | Switcher para master admin; modelo de staff ainda centraliza `profile.restaurant_id` em partes |
| Restaurante | Equipe e convites | Parcial | Associação por e-mail; permissões são array sem enforcement granular consistente |
| Catálogo | Categorias e produtos | Completa | CRUD, disponibilidade, imagem, promoções |
| Catálogo | Grupos de opções/adicionais | Completa | Editor e validação server-side no checkout |
| Catálogo | Dietas/alergênicos/estoque diário | Parcial | Campos no schema; exposição/gestão não é uniforme |
| Marketplace | Lista, busca e destaques | Completa | Busca de restaurante/produto e filtros |
| Carrinho | Persistência e isolamento por restaurante | Completa | Zustand persistido e regras de domínio |
| Checkout | Entrega, retirada, presencial | Completa | Validação, snapshots, preços recalculados |
| Checkout | Cliente convidado | Completa | Cookie/token e customer sem profile |
| Checkout | Endereços salvos | Completa | CRUD e endereço padrão |
| Cupons | CRUD e validação | Completa | Limites, validade e ajuste atômico de uso |
| Pedidos | Criação e KDS | Completa | Board, tabela, transições e Realtime |
| Pedidos | Autoaceite e preparo | Completa | Trigger, countdown e alertas |
| Pedidos | Cancelamentos/reembolsos | Parcial | Cancelamento existe; refund tem schema/RLS sem operação completa de gateway/UI |
| Pagamentos | PIX Asaas | Completa | Criação, webhook, sync e polling; requer hardening de autorização |
| Pagamentos | Cartão online | Parcial | Tipos/mock existem; experiência e homologação não demonstradas |
| Pagamentos | Dinheiro/cartão na entrega | Completa | Métodos e troco |
| Pagamentos | Split marketplace | Parcial | Wallet/fee configuráveis; conciliação e homologação não demonstradas |
| Entrega | Cadastro/onboarding do entregador | Completa | Dados, veículo e documentos |
| Entrega | Aprovação administrativa | Completa | Lista e action de status |
| Entrega | Pool e aceite de pedidos | Completa | Policies e fluxo de claim |
| Entrega | GPS e mapa | Parcial | Tracking/Reatime/Leaflet existem; geocoding/roteamento dependem de serviços públicos e faltam testes ponta a ponta |
| Entrega | PIN de confirmação | Completa | Código, policy e confirmação |
| Cliente | Conta e histórico | Completa | Pedidos, endereços, avaliações e favoritos |
| Cliente | Favoritos de produto/restaurante | Completa | Tabelas, actions e componentes |
| Cliente | Avaliações | Completa | CRUD, resumo e alerta Realtime |
| Cliente | Fidelidade/pontos | Parcial | Campos agregados existem, sem programa operacional completo |
| Social | Posts e imagens | Completa | Criação, exclusão, pin e feed |
| Social | Likes, comentários e saves | Infra | Schema/RLS/contadores; fluxo de UI/actions não está completo |
| Social | Stories/vídeo | Parcial | Tipos e apresentação; publicação rica não demonstrada |
| Social | Denúncia/moderação | Parcial | Admin resolve denúncias; criação de denúncia não aparece como fluxo completo |
| Notificações | In-app e Realtime | Parcial | Bell e geração de eventos; preferências/canais/push ausentes |
| Relatórios | Receita e pedidos | Completa | Períodos e exportação CSV |
| Admin | Aprovação/bloqueio de restaurante | Completa | UI/actions e proteção de colunas |
| Admin | Métricas de negócio | Completa | GMV, receita, mix e gatilhos |
| Admin | Auditoria | Infra | Tabela/RLS, mas cobertura de eventos não demonstrada |
| Suporte | Tickets e mensagens | Infra | Schema/RLS sem UI/actions completas |
| Estoque | Itens e movimentos | Completa | CRUD, entrada/saída e trigger de saldo |
| Estoque | Ficha técnica e baixa por venda | Completa | Receita por produto e trigger |
| Estoque | Integração com insumos | Parcial | Transferência automática existe; faltam reconciliação e testes de banco |
| Insumos | Itens e lançamentos | Completa | CRUD e ledger |
| Insumos | Aprovação por pares | Parcial | Migration 0047 e actions; alterações locais ainda não consolidadas |
| Insumos | Lotes/pagamento/impressão | Parcial | RPC e agente local no working tree; segurança/operabilidade pendentes |
| Studio | Upload e biblioteca | Parcial | Biblioteca própria e Nenos Studio; acervo prometido como “em breve” |
| PWA | Manifest, service worker e prompt | Parcial | Assets existem; estratégia de cache/offline não foi homologada |
| Observabilidade | Captura de eventos/erros | Parcial | Wrapper de console; sem backend de APM confirmado |
| LGPD | Privacidade e termos | Parcial | Páginas existem; direitos do titular, retenção e governança não estão implementados |
| ERP | Financeiro, fiscal, compras e contas | Ausente | Fora da Fase 0 |
| CRM | Segmentação, funil e campanhas | Ausente | Fora da Fase 0 |
| IA | Recomendações, copilotos e automações | Ausente | Fora da Fase 0 |
