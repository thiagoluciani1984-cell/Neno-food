# Dívida técnica

## Registro priorizado

| ID | Prioridade | Dívida | Consequência | Critério de saída |
|---|---:|---|---|---|
| TD-001 | P0 | Sem testes automatizados de RLS | Vazamento cross-tenant | Matriz de testes por tabela/persona no CI |
| TD-002 | P0 | Redirects não normalizados | Open redirect | Helper único e testes adversariais |
| TD-003 | P0 | Autorização de endpoints admin/payment/local | Bypass e abuso | Identidade, ownership/tenant, origin e rate limit testados |
| TD-004 | P1 | `database.types.ts` manual | Drift silencioso | Geração/comparação automática no CI |
| TD-005 | P1 | Fonte de autorização duplicada | Regras divergentes | Policy/capability centralizada |
| TD-006 | P1 | Permissões de staff não granulares | Privilégio excessivo | Capabilities aplicadas em UI/action/RLS |
| TD-007 | P1 | Cobertura E2E mínima | Regressões no fluxo de receita | Compra, pagamento, KDS e entrega testados |
| TD-008 | P1 | Domínio e features misturam regras/infra | Testabilidade e troca de backend difíceis | Casos de uso críticos isolados |
| TD-009 | P1 | Uso amplo de service role | Blast radius elevado | Inventário, justificativa e wrappers autorizadores |
| TD-010 | P1 | Documentação e scripts históricos | Operação incorreta | README/Supabase/scripts alinhados a 47 migrations e Asaas |
| TD-011 | P1 | Sem teste de migrations do zero/upgrade | Deploy de banco arriscado | Pipeline de reset + upgrade + smoke SQL |
| TD-012 | P2 | Observabilidade limitada a console | Diagnóstico fraco | Logs estruturados, correlation ID, métricas e alertas |
| TD-013 | P2 | CSP/HSTS/Permissions-Policy ausentes | Defesa em profundidade menor | Headers compatíveis e verificados |
| TD-014 | P2 | Fluxos modelados mas órfãos | Custo cognitivo/schema morto | Implementar, retirar ou marcar formalmente |
| TD-015 | P2 | Lint não cobre scripts/E2E/config | Erros fora de `src` | Config e scripts adicionais no lint |
| TD-016 | P2 | PWA/offline não homologado | Cache obsoleto/UX inconsistente | Estratégia versionada e testes de atualização |
| TD-017 | P2 | Dependência de geocoding/rotas públicas | Disponibilidade e limites incertos | Provedor/SLA/cache/fallback definidos |
| TD-018 | P2 | Agente de impressão local ad hoc | Instalação, segurança e suporte difíceis | Protocolo autenticado, empacotamento e telemetria |

## Inconsistências documentais

- README declara 22/24 migrations em pontos diferentes; existem 47.
- `supabase/README.md` ainda traz referências históricas a Pagar.me e scripts inexistentes/desatualizados.
- `full_setup.sql` deve ser regenerado e comparado antes de uso.
- O nome do pacote é `di-qualita-food`, enquanto a marca atual é Neno/Nenos Food.

## Decisões arquiteturais pendentes

1. Fonte única de autorização e escopo de staff/moderator.
2. Estratégia de multi-restaurante para usuários não-admin.
3. Limite entre Server Actions, Route Handlers e serviços de domínio.
4. Política para service role e operações convidadas.
5. Estratégia de eventos/filas para notificações, pagamentos e integrações.
6. Observabilidade e trilha de auditoria de ações privilegiadas.
7. Versionamento e compatibilidade de schema/tipos.

## Regra de tratamento

Antes de novas áreas de produto, resolver P0 e as P1 que afetam receita, isolamento de tenants e deploy. Cada item deve ter proprietário, prazo, teste de regressão e evidência de produção.
