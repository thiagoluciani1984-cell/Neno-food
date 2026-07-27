# Variáveis de ambiente

Referência completa das variáveis usadas pelo projeto.
Copie `.env.local.example` para `.env.local` e preencha.

## Supabase (obrigatório)

| Variável | Onde obter | Uso |
|----------|------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Settings → API | Cliente browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → Settings → API | Cliente (respeita RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API | Server only — bypass RLS |

## App (obrigatório)

| Variável | Exemplo | Uso |
|----------|---------|-----|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Auth redirects, webhooks |
| `NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG` | `lucianis-di-qualita` | Fallback single-tenant |

## Asaas (pagamento online)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `ASAAS_API_KEY` | Produção | Chave de API (`$aact_...`) |
| `ASAAS_SANDBOX` | Não | `true` = usa `sandbox.asaas.com` em vez de produção |
| `ASAAS_DEV_MOCK` | Dev | `true` = simula PIX sem chave real |
| `ASAAS_PLATFORM_FEE_PERCENT` | Split | % que fica com a plataforma (padrão: 10) — o restante vai pro `asaas_wallet_id` do restaurante, sem precisar de wallet própria da plataforma |
| `ASAAS_WEBHOOK_TOKEN` | Webhook | Token único enviado no header `asaas-access-token` |
| `SENTRY_DSN` | Não | Monitoramento de erros (webhook, pagamentos) |

> Diferença do Pagar.me: a Asaas não tem um campo de expiração de PIX
> configurável — a cobrança usa `dueDate` (data de vencimento), não segundos.

## Scripts de banco (terminal only)

| Variável | Descrição |
|----------|-----------|
| `PGPW` | Senha do Postgres Supabase (nunca commitar) |
| `PROJECT_REF` | Ref do projeto (padrão: `lelimqdzvwafxzvrkszj`) |

## Produção vs desenvolvimento

| Variável | Dev | Produção |
|----------|-----|----------|
| `ASAAS_DEV_MOCK` | `true` | `false` ou ausente |
| `ASAAS_API_KEY` | opcional com mock | obrigatório |
| `ASAAS_SANDBOX` | `true` | `false` |
| `NEXT_PUBLIC_SITE_URL` | `localhost:3000` | domínio real |
