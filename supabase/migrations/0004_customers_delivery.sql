-- =====================================================================
-- 0004 · Clientes e delivery: customers, addresses, drivers,
--        favorites, reviews
-- =====================================================================

-- customer: dados de negócio do cliente (1:1 com profile do tipo customer)
create table public.customers (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null unique references public.profiles (id) on delete cascade,
  loyalty_points  integer not null default 0 check (loyalty_points >= 0),
  total_orders    integer not null default 0,
  total_spent_cents integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete cascade,
  label         text not null default 'Casa',
  recipient     text,
  street        text not null,
  number        text not null,
  complement    text,
  district      text not null,
  city          text not null,
  state         text not null,
  zip           text not null,
  reference     text,
  latitude      numeric(10,7),
  longitude     numeric(10,7),
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.drivers (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null unique references public.profiles (id) on delete cascade,
  restaurant_id   uuid references public.restaurants (id) on delete set null,
  vehicle_type    text not null default 'motorcycle',
  vehicle_plate   text,
  status          public.driver_status not null default 'offline',
  is_approved     boolean not null default false,
  total_deliveries integer not null default 0,
  total_earnings_cents integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- favoritos do cliente (M:N customer <-> product)
create table public.favorites (
  customer_id  uuid not null references public.customers (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (customer_id, product_id)
);

-- avaliações do restaurante (e, opcionalmente, do pedido)
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  customer_id   uuid not null references public.customers (id) on delete cascade,
  order_id      uuid, -- FK adicionada em 0005 (orders ainda não existe)
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now(),
  unique (customer_id, order_id)
);
