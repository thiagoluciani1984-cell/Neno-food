-- =====================================================================
-- 0005 · Pedidos, pagamentos, cupons e notificações
--        orders, order_items, payments, coupons, coupon_usage, notifications
-- =====================================================================

create table public.coupons (
  id               uuid primary key default gen_random_uuid(),
  restaurant_id    uuid not null references public.restaurants (id) on delete cascade,
  code             text not null,
  type             public.coupon_type not null,
  value_cents      integer not null default 0 check (value_cents >= 0), -- fixo: em centavos / percentual: 0..100 (em "value_percent")
  value_percent    numeric(5,2) check (value_percent between 0 and 100),
  min_order_cents  integer not null default 0 check (min_order_cents >= 0),
  max_discount_cents integer check (max_discount_cents >= 0),
  usage_limit      integer check (usage_limit >= 0),       -- limite global de usos
  per_customer_limit integer check (per_customer_limit >= 0),
  used_count       integer not null default 0,
  starts_at        timestamptz not null default now(),
  expires_at       timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (restaurant_id, code)
);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  restaurant_id      uuid not null references public.restaurants (id) on delete cascade,
  customer_id        uuid references public.customers (id) on delete set null,
  driver_id          uuid references public.drivers (id) on delete set null,
  coupon_id          uuid references public.coupons (id) on delete set null,
  order_number       bigint generated always as identity, -- número sequencial amigável
  type               public.order_type not null default 'delivery',
  status             public.order_status not null default 'received',
  payment_method     public.payment_method not null default 'pix',
  payment_status     public.payment_status not null default 'pending',
  -- snapshot do endereço de entrega (independe de edições futuras)
  delivery_address   jsonb,
  customer_name      text,
  customer_phone     text,
  notes              text,
  -- valores (sempre em centavos)
  subtotal_cents     integer not null default 0 check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  discount_cents     integer not null default 0 check (discount_cents >= 0),
  total_cents        integer not null default 0 check (total_cents >= 0),
  change_for_cents   integer, -- troco para (pagamento em dinheiro)
  confirmed_at       timestamptz,
  ready_at           timestamptz,
  delivered_at       timestamptz,
  cancelled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- itens do pedido: GUARDAM SNAPSHOT de nome/preço (histórico imutável)
create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  product_id         uuid references public.products (id) on delete set null,
  product_name       text not null,
  unit_price_cents   integer not null check (unit_price_cents >= 0),
  quantity           integer not null check (quantity > 0),
  total_cents        integer not null check (total_cents >= 0),
  notes              text,
  created_at         timestamptz not null default now()
);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  method        public.payment_method not null,
  status        public.payment_status not null default 'pending',
  amount_cents  integer not null check (amount_cents >= 0),
  provider      text,           -- gateway (futuro): mercadopago, stripe...
  provider_ref  text,           -- id da transação no gateway
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.coupon_usage (
  id            uuid primary key default gen_random_uuid(),
  coupon_id     uuid not null references public.coupons (id) on delete cascade,
  customer_id   uuid references public.customers (id) on delete set null,
  order_id      uuid references public.orders (id) on delete cascade,
  discount_cents integer not null default 0,
  used_at       timestamptz not null default now()
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        public.notification_type not null default 'system',
  title       text not null,
  body        text,
  payload     jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- FKs adiadas de migrations anteriores (agora orders existe)
alter table public.reviews
  add constraint reviews_order_id_fkey
  foreign key (order_id) references public.orders (id) on delete set null;
