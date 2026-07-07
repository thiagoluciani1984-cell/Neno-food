# Deploy — Nenos Food

Guia para colocar o projeto em produção (Vercel + Supabase Cloud).

## Pré-requisitos

- Repositório no GitHub
- Projeto Supabase ativo (região: **South America — São Paulo**)
- Conta Vercel
- (Opcional) Conta Pagar.me para PIX online

---

## 1. Banco de dados (Supabase)

```powershell
$env:PGPW = "senha-do-banco"
$env:PROJECT_REF = "seu-project-ref"
npm run db:apply
```

Popule dados iniciais se necessário:

```bash
node scripts/seed-poit-pizza.js
node scripts/seed-pizza-options.js
node scripts/seed-poit-images.js
```

---

## 2. Variáveis de ambiente (Vercel)

Copie de `.env.local.example` e configure no **Vercel → Settings → Environment Variables**:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Service role (server only) |
| `NEXT_PUBLIC_SITE_URL` | Sim | `https://seu-dominio.vercel.app` |
| `NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG` | Sim | `lucianis-di-qualita` |
| `PAGARME_SECRET_KEY` | Produção | Chave secreta Pagar.me |
| `PAGARME_DEV_MOCK` | Não | `false` em produção |
| `PAGARME_PLATFORM_RECIPIENT_ID` | Split | ID recebedor plataforma |
| `PAGARME_WEBHOOK_USER` | Recomendado | Basic auth do webhook |
| `PAGARME_WEBHOOK_PASSWORD` | Recomendado | Senha do webhook |

> **Nunca** defina `PAGARME_DEV_MOCK=true` em produção.

---

## 3. Supabase Auth

Em **Authentication → URL Configuration**:

- **Site URL:** `https://seu-dominio.vercel.app`
- **Redirect URLs:**
  - `https://seu-dominio.vercel.app/**`
  - `http://localhost:3000/**` (dev)

---

## 4. Pagar.me (PIX online)

1. Crie conta em [dashboard.pagar.me](https://dashboard.pagar.me)
2. Copie `sk_live_...` ou `sk_test_...` → `PAGARME_SECRET_KEY`
3. Configure webhook:
   ```
   https://seu-dominio.vercel.app/api/payments/pagarme/webhook
   ```
4. Em cada restaurante: **Dashboard → Configurações → Recipient ID** (`rp_...`)
5. Verifique: `npm run db:verify`

---

## 5. Deploy Vercel

```bash
# Via CLI
npm i -g vercel
vercel

# Ou importe o repositório no dashboard Vercel
```

Build command: `npm run build`  
Output: Next.js (automático)

---

## 6. Pós-deploy — checklist

- [ ] Marketplace lista restaurantes ativos (`/`)
- [ ] Login/cadastro funcionando
- [ ] Pedido teste (PIX na entrega) → aparece no KDS
- [ ] PIX online (se Pagar.me configurado)
- [ ] Webhook Pagar.me recebendo eventos
- [ ] Entregador: aprovar em `/admin/drivers`
- [ ] Restaurante: aprovar em `/admin`
- [ ] Realtime: status do pedido atualiza sem refresh

---

## 7. Domínio customizado

1. Vercel → Domains → adicione seu domínio
2. Atualize `NEXT_PUBLIC_SITE_URL`
3. Atualize Redirect URLs no Supabase Auth
4. Atualize webhook URL no Pagar.me

---

## Monitoramento

- **Vercel:** Analytics + Logs (Functions)
- **Supabase:** Dashboard → Logs, Database health
- **Pagar.me:** Transações + Webhooks no painel
