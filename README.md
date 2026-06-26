# Di Qualità Food

Plataforma de **delivery e gestão para restaurantes italianos**, multi-tenant
desde o dia 1. Primeira operação: **Luciani's Di Qualità — Lasanhas & Risotos**.

Construída com **Next.js 15 + TypeScript + Tailwind + ShadCN UI** no front e
**Supabase (PostgreSQL + Auth + RLS + Storage + Realtime)** no back.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Front | Next.js 15 (App Router, Server Actions), TypeScript, Tailwind, ShadCN UI |
| Estado | Zustand (carrinho), TanStack Query |
| Back | Supabase: PostgreSQL, Auth, Row Level Security, Storage, Realtime |
| Infra | Vercel + GitHub |
| Arquitetura | Clean Architecture (domain/application/infra) + feature slices, multi-tenant |

---

## Arquitetura (resumo)

```
src/
  app/            # rotas (route groups por persona)
    (auth)/       # login, signup, recuperação
    (store)/      # cardápio, carrinho, checkout, conta, tracking (cliente)
    (dashboard)/  # painel do restaurante (KPIs, cardápio, KDS, cupons...)
    (admin)/      # console master admin
    (driver)/     # app do entregador
  core/           # DOMAIN + APPLICATION (regras puras, contratos)
  features/       # vertical slices (auth, catalog, orders, cart, coupons...)
  infra/supabase/ # clients (browser/server/admin), middleware, repos
  components/ui/  # ShadCN
  lib/ config/ types/
supabase/
  migrations/     # SQL versionado (tabelas, índices, triggers, RLS, storage)
  seed.sql        # restaurante + cardápio inicial
```

Princípios: o domínio não conhece Supabase; **RLS é a segurança primária**
(isolamento multi-tenant no banco); dinheiro sempre em **centavos**; preços e
descontos **recalculados no servidor** no checkout.

Personas e rotas protegidas (via `src/middleware.ts`):
`/dashboard` (restaurant/master) · `/admin` (master) · `/driver` (driver) ·
`/account` (autenticado).

---

## Pré-requisitos

- Node.js 18.18+ (recomendado 20+)
- Conta no [Supabase](https://supabase.com) **ou** [Supabase CLI](https://supabase.com/docs/guides/cli) para ambiente local

---

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Copie o exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG=lucianis-di-qualita
```

### 3. Banco de dados

**Opção A — Supabase Cloud:** no SQL Editor, execute em ordem os arquivos de
`supabase/migrations/` (0001 → 0010) e depois `supabase/seed.sql`.

**Opção B — Supabase CLI (local):**

```bash
supabase start          # sobe Postgres + Studio + Auth locais
supabase db reset       # aplica migrations e seed automaticamente
npm run db:types        # (opcional) regenera src/types/database.types.ts
```

### 4. Rodar

```bash
npm run dev
```

Acesse http://localhost:3000.

---

## Primeiros acessos

1. **Cliente:** cadastre-se em `/signup` (vira `customer` automaticamente) e faça um pedido.
2. **Restaurante / Master:** crie o usuário via signup e, no Supabase, ajuste o
   `role` em `public.profiles` para `restaurant` ou `master_admin`. Para staff de
   restaurante, defina também `profiles.restaurant_id` com o id do Luciani's.
3. **Entregador:** role `driver` + registro em `public.drivers`.

> O trigger `handle_new_user` provisiona o `profile` (e o `customer`) no signup.
> O `role` pode ser enviado no metadata do signup ou ajustado depois pelo admin.

---

## Funcionalidades (MVP Fase 1)

- [x] Autenticação (login, cadastro, recuperação) + controle de acesso por perfil
- [x] Dashboard administrativo com KPIs em tempo real
- [x] CRUD de categorias e produtos + upload de imagens (Storage)
- [x] Cardápio online elegante (identidade italiana premium)
- [x] Carrinho (Zustand, persistente) e checkout (delivery/retirada, cupom, pagamento)
- [x] Cadastro de clientes + histórico de pedidos
- [x] Recebimento de pedidos em **tempo real** (KDS) via Supabase Realtime
- [x] Alteração de status com máquina de estados (Recebido → ... → Entregue)
- [x] Cupons (percentual, fixo, frete grátis)
- [x] Relatórios financeiros básicos (faturamento, ticket médio, formas de pagamento)
- [x] Console Master Admin (aprovar/bloquear restaurantes, GMV)
- [x] Área do entregador (entregas e ganhos)

---

## Modelo de dados

19 tabelas com RLS: `roles`, `profiles`, `restaurants`, `restaurant_settings`,
`categories`, `products`, `product_images`, `customers`, `addresses`, `drivers`,
`favorites`, `reviews`, `coupons`, `coupon_usage`, `orders`, `order_items`,
`payments`, `notifications`. Detalhes nas migrations.

---

## Deploy (Vercel)

1. Suba o repositório no GitHub.
2. Importe no Vercel, configure as mesmas variáveis de ambiente.
3. Em produção, use a URL real em `NEXT_PUBLIC_SITE_URL` e adicione-a às
   *Redirect URLs* do Supabase Auth.

---

© Di Qualità Food
