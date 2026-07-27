# Deploy — Nenos Food

Guia para colocar o projeto em produção (Vercel + Supabase Cloud).

## Pré-requisitos

- Repositório no GitHub
- Projeto Supabase ativo (região: **South America — São Paulo**)
- Conta Vercel
- (Opcional) Conta Asaas para PIX online

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
| `ASAAS_API_KEY` | Produção | Chave de API Asaas (produção) |
| `ASAAS_SANDBOX` | Não | `false` em produção |
| `ASAAS_DEV_MOCK` | Não | `false` em produção |
| `ASAAS_PLATFORM_FEE_PERCENT` | Split | % da plataforma (padrão: 10) |
| `ASAAS_WEBHOOK_TOKEN` | Recomendado | Token do header `asaas-access-token` |

> **Nunca** defina `ASAAS_DEV_MOCK=true` em produção.

---

## 3. Supabase Auth

Em **Authentication → URL Configuration**:

- **Site URL:** `https://seu-dominio.vercel.app`
- **Redirect URLs:**
  - `https://seu-dominio.vercel.app/**`
  - `https://seu-dominio.vercel.app/auth/callback`
  - `https://seu-dominio.vercel.app/auth/reset-password`
  - `http://localhost:3000/**` (dev)

---

## 4. Asaas (PIX online)

1. Crie conta em [asaas.com](https://www.asaas.com) (produção) — a conta de
   sandbox usada em desenvolvimento não vale para cobranças reais
2. Copie a chave de API → `ASAAS_API_KEY` (defina `ASAAS_SANDBOX=false`)
3. Gere o token de webhook: `npm run asaas:setup -- --webhook-token`
4. Configure webhook no painel Asaas → Integrações → Webhooks:
   ```
   https://seu-dominio.vercel.app/api/payments/asaas/webhook
   ```
   Header `asaas-access-token` com o valor gerado.
5. Em cada restaurante: **Dashboard → Configurações → Wallet ID**
6. Verifique: `npm run db:verify`

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
- [ ] PIX online (se Asaas configurado)
- [ ] Webhook Asaas recebendo eventos
- [ ] Entregador: aprovar em `/admin/drivers`
- [ ] Restaurante: aprovar em `/admin`
- [ ] Realtime: status do pedido atualiza sem refresh

---

## 7. Domínio customizado

1. Vercel → Domains → adicione seu domínio
2. Atualize `NEXT_PUBLIC_SITE_URL`
3. Atualize Redirect URLs no Supabase Auth
4. Atualize webhook URL no painel Asaas

---

## Monitoramento

- **Vercel:** Analytics + Logs (Functions)
- **Supabase:** Dashboard → Logs, Database health
- **Asaas:** Transações + Webhooks no painel
