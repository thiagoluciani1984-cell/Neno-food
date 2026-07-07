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

## Pagar.me (pagamento online)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `PAGARME_SECRET_KEY` | Produção | `sk_test_...` ou `sk_live_...` |
| `PAGARME_DEV_MOCK` | Dev | `true` = simula PIX sem chave real |
| `PAGARME_PLATFORM_RECIPIENT_ID` | Split | ID recebedor da plataforma (`rp_...`) |
| `PAGARME_PLATFORM_FEE_PERCENT` | Split | % da plataforma (padrão: 10) |
| `PAGARME_WEBHOOK_USER` | Webhook | Basic auth — usuário |
| `PAGARME_WEBHOOK_PASSWORD` | Webhook | Basic auth — senha |
| `PAGARME_PIX_EXPIRES_IN` | Não | Expiração PIX em segundos (padrão: 3600) |

## Scripts de banco (terminal only)

| Variável | Descrição |
|----------|-----------|
| `PGPW` | Senha do Postgres Supabase (nunca commitar) |
| `PROJECT_REF` | Ref do projeto (padrão: `lelimqdzvwafxzvrkszj`) |

## Produção vs desenvolvimento

| Variável | Dev | Produção |
|----------|-----|----------|
| `PAGARME_DEV_MOCK` | `true` | `false` ou ausente |
| `PAGARME_SECRET_KEY` | opcional com mock | obrigatório |
| `NEXT_PUBLIC_SITE_URL` | `localhost:3000` | domínio real |
