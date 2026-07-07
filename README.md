# Nenos Food (Di Qualità Food)

Marketplace multi-tenant de **delivery e gestão para restaurantes**.
Operações ativas: **Luciani's Di Qualità** e **Point da Pizza**.

Stack: **Next.js 16 + TypeScript + Tailwind + ShadCN UI** · **Supabase** (PostgreSQL, Auth, RLS, Storage, Realtime) · **Pagar.me** (PIX online).

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Front | Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind, ShadCN UI |
| Estado | Zustand (carrinho), TanStack Query |
| Back | Supabase: PostgreSQL, Auth, Row Level Security, Storage, Realtime |
| Pagamentos | Pagar.me (PIX online + split marketplace) |
| Infra | Vercel + GitHub |
| Arquitetura | Clean Architecture + feature slices, multi-tenant desde o dia 1 |

---

## Rotas principais

| Persona | Rotas | Acesso |
|---------|-------|--------|
| Cliente | `/`, `/[slug]`, `/cart`, `/checkout`, `/order/[id]`, `/feed`, `/account` | Público + autenticado |
| Restaurante | `/dashboard/*` | `restaurant`, `master_admin` |
| Master Admin | `/admin`, `/admin/drivers` | `master_admin` |
| Entregador | `/driver`, `/driver/onboarding` | `driver` |
| Onboarding | `/onboarding/*` | Novo restaurante |

---

## Início rápido

### 1. Dependências

```bash
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha as credenciais Supabase. Para dev sem Pagar.me, mantenha `PAGARME_DEV_MOCK=true`.

### 3. Banco de dados

```powershell
# Windows PowerShell
$env:PGPW = "sua-senha-supabase"
npm run db:apply
```

Detalhes: [supabase/README.md](supabase/README.md)

### 4. Rodar

```bash
npm run dev
```

Acesse http://localhost:3000

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | Verificação TypeScript |
| `npm run db:build` | Gera `supabase/full_setup.sql` |
| `npm run db:apply` | Aplica migrations 0001–0022 no Supabase |
| `npm run db:apply:full` | Aplica `full_setup.sql` (banco vazio) |
| `npm run db:types` | Regenera tipos TS (Supabase CLI local) |
| `npm run db:verify` | Testa conexão Pagar.me |

### Seeds (dados de exemplo)

```bash
node scripts/seed-poit-pizza.js      # Point da Pizza (41 produtos)
node scripts/seed-pizza-options.js   # Bordas e adicionais
node scripts/seed-poit-images.js     # Imagens Unsplash
node scripts/cleanup-lucianis-menu.js # Limpa cardápio genérico do Luciani's
```

---

## Primeiros acessos

| Perfil | Como criar |
|--------|------------|
| **Cliente** | `/signup` — role `customer` automático |
| **Restaurante** | `/signup/restaurant` → wizard `/onboarding` → aprovação em `/admin` |
| **Master Admin** | Signup + alterar `profiles.role = 'master_admin'` no Supabase |
| **Entregador** | `/signup/driver` → onboarding → aprovação em `/admin/drivers` |

---

## Funcionalidades

### Loja (cliente)
- Marketplace com busca de restaurantes e produtos
- Cardápio com opções (borda, adicionais), carrinho persistente
- Checkout: entrega/retirada, cupom, endereços salvos
- PIX online (Pagar.me) ou pagamento na entrega
- Acompanhamento de pedido em tempo real + código PIN de entrega
- Feed social, favoritos, avaliações, notificações

### Dashboard (restaurante)
- KPIs, KDS em tempo real, gestão de cardápio
- Cupons, relatórios (7/30/90 dias), configurações
- Posts sociais, multi-restaurante (master_admin)

### Admin (plataforma)
- Aprovar/bloquear restaurantes e entregadores
- GMV, vincular dono por e-mail

### Entregador
- Portal online/offline, aceitar entregas
- Confirmação por PIN, GPS tracking

---

## Arquitetura

```
src/
  app/            # rotas (route groups por persona)
  core/           # domínio + contratos (Clean Architecture)
  features/       # vertical slices (auth, orders, catalog, driver...)
  infra/supabase/ # clients Supabase + middleware
  lib/            # pagamentos, utils
supabase/
  migrations/     # 22 migrations SQL versionadas
  seed.sql        # dados iniciais Luciani's
docs/
  DEPLOY.md       # guia de deploy Vercel + Pagar.me
```

Princípios: **RLS** como segurança primária · dinheiro em **centavos** · preços **recalculados no servidor**.

---

## Modelo de dados

30+ tabelas com RLS, incluindo:

`profiles`, `restaurants`, `restaurant_settings`, `categories`, `products`, `product_options`, `orders`, `order_items`, `order_item_options`, `payments`, `coupons`, `drivers`, `driver_vehicles`, `driver_documents`, `delivery_tracking`, `delivery_codes`, `posts`, `notifications`, `restaurant_favorites`...

Detalhes: `supabase/migrations/` e [supabase/README.md](supabase/README.md).

---

## Deploy

Guia completo: [docs/DEPLOY.md](docs/DEPLOY.md)

Resumo:
1. `npm run db:apply` no Supabase Cloud
2. Configure env vars na Vercel
3. Configure Auth redirect URLs + webhook Pagar.me
4. Deploy via GitHub → Vercel

---

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [supabase/README.md](supabase/README.md) | Banco de dados, migrations, troubleshooting |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Deploy produção, env vars, checklist |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Referência de variáveis de ambiente |
| [.env.local.example](.env.local.example) | Template de configuração local |

---

© Nenos Food / Di Qualità Food
