# Primeiro sprint — estabilização da fundação

## Objetivo

Reduzir o risco imediato de segurança e tornar banco, autorização e jornada de compra verificáveis antes de adicionar funcionalidades.

## Backlog priorizado

| Ordem | Item | Pri. | Estimativa | Dependência |
|---:|---|:---:|:---:|---|
| 1 | Validar e normalizar redirects de login e auth callback | P0 | S | Nenhuma |
| 2 | Proteger sync/mock de pagamento e impressão por identidade, ownership/tenant, ambiente e rate limit | P0 | M | Matriz de acesso |
| 3 | Montar Supabase/Postgres descartável e aplicar migrations 0001–0047 | P0 | M | Infra de CI |
| 4 | Criar testes RLS para customer, restaurant, staff, driver, moderator, master e anon | P0 | L | Item 3 |
| 5 | Definir fonte única de roles/capabilities e resolver divergência de moderator | P1 | M | Decisão de produto |
| 6 | Validar tipos gerados contra `database.types.ts` no CI | P1 | M | Item 3 |
| 7 | Criar E2E do pedido convidado e autenticado até KDS | P1 | L | Fixture de dados |
| 8 | Criar testes de webhook/sync/idempotência Asaas | P1 | M | Sandbox/mock controlado |
| 9 | Atualizar README, Supabase README, scripts e contagens de migrations | P1 | S | Itens 3/6 |
| 10 | Introduzir logs estruturados/correlation ID em pedido, pagamento e entrega | P1 | M | Padrão de observabilidade |
| 11 | Definir política de guest token, expiração e redaction | P1 | M | Revisão de produto/LGPD |
| 12 | Documentar runbook de deploy/rollback/migration | P2 | S | Pipeline definido |

Estimativas: S ≤ 1 dia, M = 1–3 dias, L = 3–5 dias. Devem ser recalibradas pela equipe após refinamento.

## Histórias e critérios de aceite

### S1 — Redirect seguro

Como usuário, quero retornar apenas a uma rota interna válida após autenticar.

- Helper único aceita `/path?query` interno.
- Rejeita URL absoluta, `//host`, backslashes e payloads codificados equivalentes.
- Login e callback usam o helper.
- Testes unitários cobrem casos válidos e adversariais.

### S2 — APIs sensíveis autorizadas

Como operador da plataforma, quero impedir que IDs conhecidos permitam consultar ou alterar recursos alheios.

- Sync/mock verifica sessão ou token de convidado e vínculo com o pedido.
- Impressão verifica restaurante/papel e só funciona em ambiente local explicitamente habilitado.
- Rate limit e respostas não enumeráveis são aplicados.
- Testes provam negação cross-tenant e anon.

### S3 — Banco reproduzível e RLS testada

Como equipe, quero provar que migrations e policies produzem o mesmo banco sempre.

- Banco vazio recebe 0001–0047 sem intervenção manual.
- Fixtures criam todas as personas/tenants.
- Cada tabela sensível tem ao menos casos allow/deny.
- Pipeline falha por drift de schema/tipos.

### S4 — Jornada de receita protegida

Como negócio, quero detectar regressões na compra antes do deploy.

- E2E cobre cardápio, opções, carrinho, cupom, checkout e criação do pedido.
- Casos convidado e autenticado.
- Pagamento mock/sandbox confirma idempotência e atualização de status.
- Restaurante enxerga o pedido no KDS.

## Definição de pronto

- Código revisado e sem P0 conhecido no escopo.
- Typecheck, lint, unit, integração, RLS, E2E crítico e build verdes.
- Evidência de autorização negativa incluída.
- Migration tem rollback/roll-forward documentado.
- Logs não contêm segredo, token, CPF ou payload financeiro desnecessário.
- Documentação e runbook atualizados junto da mudança.

## Fora do sprint

- ERP, CRM, IA.
- Novas features sociais ou campanhas.
- Redesign visual amplo.
- Expansão de meios de pagamento sem antes estabilizar o ciclo atual.
