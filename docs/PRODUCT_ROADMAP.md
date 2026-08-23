# Roadmap de desenvolvimento

O roadmap é orientado por gates, não por datas artificiais. A próxima fase só inicia quando os critérios de saída da anterior forem medidos.

## Fase 0 — Descoberta e planejamento (atual)

Objetivo: criar baseline verificável do produto, arquitetura, dados, segurança e backlog.

Entregas: os nove documentos da pasta `docs`, resultados de typecheck/lint/test/build e registro dos problemas. Nenhuma funcionalidade nova.

Gate: documentos revisados pelo responsável do produto e branch aprovada sem merge automático.

## Fase 1 — Fundação segura e reproduzível

Prioridades:

1. Corrigir redirects e autorizações dos endpoints sensíveis.
2. Criar suíte de RLS/autorização por persona.
3. Aplicar migrations em ambiente descartável e detectar drift de tipos/schema.
4. Centralizar capabilities de staff/moderator.
5. Atualizar documentação operacional e remover referências históricas.
6. Implantar logs estruturados e correlation IDs nos fluxos críticos.

Gate: zero P0 aberto; CI completo; isolamento cross-tenant demonstrado.

## Fase 2 — Confiabilidade do ciclo de receita

Prioridades:

1. E2E de loja → checkout → pagamento → KDS → conclusão.
2. Idempotência e reconciliação Asaas; alertas de webhook.
3. Cancelamento e reembolso operacional completo.
4. Tratamento de falhas, retry e estados intermediários.
5. Métricas de conversão, pagamento e tempo de preparo.

Gate: fluxos homologados em sandbox/staging e runbooks de falha disponíveis.

## Fase 3 — Operação e logística

Prioridades:

1. Homologar driver, pool, limite de pedidos, GPS, rota e PIN.
2. Consolidar estoque/insumos, concorrência, lotes e impressão local.
3. Alertas de estoque e reconciliação de movimentos.
4. Permissões operacionais granulares e auditoria administrativa.

Gate: jornada de entrega e fechamento operacional testada ponta a ponta.

## Fase 4 — Experiência, retenção e governança

Prioridades:

1. Completar social (likes, comentários, saves, denúncia) ou reduzir escopo.
2. Notificações e preferências por canal.
3. Programa de fidelidade com regras claras.
4. Suporte/tickets e experiência de moderação.
5. Direitos LGPD, retenção, consentimento e versionamento de termos.
6. Performance, acessibilidade e PWA/offline.

Gate: métricas de retenção, suporte e privacidade operacionais.

## Fase 5 — Expansões condicionadas

Somente após estabilidade, dados confiáveis e validação comercial:

- ERP: avaliar integração versus construção para fiscal, compras e financeiro.
- CRM: avaliar segmentação, campanhas, consentimento e atribuição.
- IA: avaliar casos com ganho mensurável, governança, custo e revisão humana.

Esses itens não são compromisso de implementação. Cada um exige discovery, business case, avaliação build-vs-buy e revisão de LGPD/segurança.

## Métricas norteadoras

- Conversão visita → pedido.
- Sucesso de criação/confirmação de pagamento.
- Pedidos duplicados ou estados divergentes.
- Tempo até confirmação, preparo, aceite e entrega.
- Incidentes de autorização e falhas cross-tenant (meta: zero).
- Erros por release e tempo de recuperação.
- Cobertura dos fluxos críticos, não apenas cobertura de linhas.
- Solicitações LGPD atendidas dentro do SLA definido.
