# Segurança e LGPD

## Síntese

A base tem decisões positivas — RLS ampla, webhook Asaas fail-closed, preços recalculados no servidor, rate limiting em login/signup/pedido e uso separado de service role. Ainda assim, não deve ser considerada pronta para produção regulada sem hardening e testes adversariais.

## Achados priorizados

| Prioridade | Achado | Impacto | Ação recomendada |
|---|---|---|---|
| P0 | Destinos de redirect são aceitos em login e callback sem allowlist explícita de caminho interno | Open redirect/phishing ou comportamento inesperado | Aceitar somente paths relativos iniciados por `/`, rejeitar `//`, protocolos e caracteres ambíguos |
| P0 | `GET /api/payments/asaas/sync` recebe apenas `order` e usa client admin | Consulta/mutação de pagamento por identificador, se não houver checagem interna suficiente | Autenticar, validar dono/token/tenant e aplicar rate limit |
| P0 | Confirmação mock e impressão local precisam de autorização explícita | Abuso em ambiente mal configurado/local | Exigir sessão, papel/tenant e proteção CSRF/origin; mock apenas fora de produção |
| P0 | RLS não possui suíte automatizada | Regressão de isolamento multi-tenant pode passar despercebida | Testes por tabela/papel em PostgreSQL descartável |
| P1 | Middleware e páginas divergem para `moderator` | Acesso confuso, falhas ou futura elevação acidental | Centralizar política de autorização |
| P1 | Permissões de staff são armazenadas, mas não aplicadas granularmente | Staff recebe poder amplo do tenant | Capabilities verificadas em action e RLS |
| P1 | Service role é usada em queries de catálogo/pedido/entrega/convidado | Bypass de RLS aumenta blast radius de bugs | Minimizar usos e revalidar autorização em cada função |
| P1 | Token de pedido convidado não tem expiração explícita no modelo | Link vazado pode permanecer válido | Hash, expiração, rotação e revogação |
| P1 | Rate limit depende do IP reportado por headers | Spoofing/bypass se proxy não for tratado corretamente | Confiar apenas em header da plataforma e combinar IP+conta/entidade |
| P1 | Tipos manuais e schema Cloud não verificado | Validação incorreta e exposição acidental de campos | Gerar/validar tipos no CI e auditar migrations aplicadas |
| P2 | Headers não incluem CSP, HSTS e Permissions-Policy | Defesa em profundidade incompleta | Adicionar após inventário de origens e testes |
| P2 | Observabilidade é console-based e não demonstra trilha imutável | Incidentes e acessos administrativos difíceis de investigar | APM/logs estruturados com redaction e alertas |
| P2 | Uploads precisam de validação documentada | Conteúdo malicioso, custo e vazamento de metadados | Validar conteúdo real, dimensão, tamanho, EXIF e prefixo por tenant |

## Controles já presentes

- RLS habilitado nas tabelas de domínio.
- Funções `SECURITY DEFINER` usam `search_path = public` nas ocorrências auditadas.
- Colunas de aprovação/status de restaurante protegidas por trigger.
- Webhook Asaas rejeita requisições quando o segredo está ausente ou incorreto.
- Total/preço de pedido é resolvido novamente no servidor.
- Cupons têm ajuste atômico e pedidos/driver têm proteções de concorrência.
- Documentos são projetados como privados com signed URLs.
- Headers `nosniff`, `DENY` para framing e referrer policy estão configurados.

## LGPD — inventário de dados

| Categoria | Exemplos | Titulares | Sensibilidade/risco |
|---|---|---|---|
| Identificação | nome, e-mail, telefone, CPF/CNPJ | cliente, staff, driver, dono | Alto para CPF e documentos |
| Endereço/localização | endereço, GPS, tracking | cliente e driver | Alto; revela rotina e deslocamento |
| Financeiro | chave PIX, banco, pagamentos, reembolsos | driver, restaurante, cliente | Alto |
| Comercial | pedidos, gastos, favoritos, avaliações | cliente | Perfil comportamental |
| Conteúdo | posts, comentários, denúncias, imagens | usuários/restaurantes | Moderação e direitos autorais |
| Técnico | IP, user agent, logs, tokens | todos | Segurança; minimizar e reter por prazo definido |

## Lacunas LGPD

- Não há fluxo completo de solicitação de acesso, correção, portabilidade ou eliminação.
- Não há matriz formal de base legal/finalidade por dado.
- Não há política executável de retenção e descarte para pedidos, GPS, documentos e logs.
- Consentimento/preferências de marketing e canais não estão modelados.
- Não há evidência de registro de operadores/suboperadores, RIPD, DPO/canal do encarregado ou plano de incidente.
- As páginas legais são estáticas e não provam governança operacional.

## Plano de adequação

1. P0: corrigir authorization/redirects/endpoints e criar testes RLS.
2. P0: classificar dados, finalidade, base legal, controlador/operador e retenção.
3. P1: implementar exportação/correção/exclusão com exceções legais e trilha auditável.
4. P1: criptografia/segredos, rotação, backups, restore testado e resposta a incidentes.
5. P1: minimizar GPS/documentos e automatizar descarte.
6. P2: consentimento de marketing, versionamento de termos e registro de aceite.

Este documento é uma análise técnica, não parecer jurídico. A validação final deve envolver assessoria especializada em LGPD e contratos com operadores.
