# Personas e permissões

## Personas

| Persona | Objetivo | Superfície principal |
|---|---|---|
| Visitante | Descobrir restaurantes e comprar sem conta | Marketplace/loja/checkout |
| Cliente | Comprar, acompanhar e gerenciar histórico | Loja e `/account` |
| Dono de restaurante | Operar loja, catálogo, pedidos e indicadores | `/dashboard` |
| Staff | Executar tarefas delegadas do restaurante | `/dashboard` |
| Entregador | Aceitar, transportar e concluir entregas | `/driver` |
| Moderador | Moderar conteúdo | `/admin/moderation` pretendido |
| Master admin | Governar toda a plataforma | `/admin` e dashboards selecionados |
| Titular convidado | Consultar pedido por token opaco | `/order/[id]` e API de status |
| Service role | Executar integrações e operações confiáveis | Somente servidor |

## Matriz de acesso atual

| Recurso | Público | Cliente | Restaurante | Staff | Driver | Moderador | Master admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Marketplace/cardápio ativo | L | L | L | L | L | L | L |
| Conta/endereço/favoritos próprios | — | CRUD | próprio | próprio | próprio | próprio | próprio |
| Pedido próprio | token | L/C | — | — | entrega atribuída | — | L |
| Catálogo do restaurante | L | L | CRUD | CRUD* | — | — | CRUD |
| Pedidos do restaurante | — | próprio | CRUD | CRUD* | pool/atribuído | — | CRUD |
| Configuração/restaurante | público limitado | — | CRUD | CRUD* | — | — | CRUD |
| Localização de entrega | pedido autorizado | pedido próprio | pedidos próprios | pedidos próprios | própria/atribuída | — | L |
| Administração | — | — | — | — | — | parcial pretendido | CRUD |

`*` O banco reconhece vínculo de staff, mas o array `restaurant_staff.permissions` não é aplicado de maneira granular e uniforme em actions, páginas e policies.

## Guards de rota

- `/dashboard`: `restaurant`, `staff`, `master_admin`.
- `/admin`: middleware aceita `master_admin` e `moderator`; páginas aceitam apenas `master_admin`. Corrigir a fonte de verdade.
- `/driver`: `driver`, `master_admin`.
- `/onboarding`: `restaurant`, `master_admin`.
- `/account`: qualquer papel autenticado listado.

## Princípios recomendados

1. Tornar a autorização server-side/RLS a fonte de verdade; guards de UI servem somente à navegação.
2. Definir capacidades nomeadas para staff (`orders.read`, `orders.update`, `catalog.write`, `reports.read`, etc.) e aplicá-las em todos os pontos de mutação.
3. Separar moderator de master admin e decidir explicitamente quais telas/actions cada um pode usar.
4. Nunca expor `service_role` ao browser; toda chamada administrativa deve revalidar identidade e papel antes de usar o client admin.
5. Tratar token de convidado como segredo: alta entropia, expiração/rotação, não registrar em logs e não expor em referers.
6. Criar testes de contrato de autorização por persona e por tabela RLS.
