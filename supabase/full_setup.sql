-- =====================================================================
-- Nenos Food — full_setup.sql (GERADO AUTOMATICAMENTE)
-- =====================================================================
-- NÃO edite este arquivo manualmente.
-- Para regenerar: npm run db:build
--
-- Conteúdo: 32 migrations (0001–0022) + seed.sql
-- Gerado em: 2026-07-19T10:31:42.698Z
-- =====================================================================


-- ─── 0001_extensions_and_enums.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0001 · Extensões e tipos enumerados
-- Di Qualità Food — base do schema multi-tenant
-- =====================================================================

create extension if not exists "pgcrypto";        -- gen_random_uuid()
create extension if not exists "citext";           -- e-mails case-insensitive
create extension if not exists "pg_trgm";          -- busca textual em produtos

-- ─── Enums de domínio ────────────────────────────────────────────────
-- Cada CREATE TYPE é envolvido num bloco que ignora "já existe" (42710),
-- pra ser seguro rodar de novo num banco parcialmente migrado.

do $$ begin
  create type public.user_role as enum (
    'master_admin',
    'restaurant',
    'customer',
    'driver'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.restaurant_status as enum (
    'pending',   -- aguardando aprovação do master admin
    'active',
    'blocked'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_type as enum (
    'delivery',
    'pickup',    -- retirada no balcão
    'dine_in'    -- consumo local
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'received',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum (
    'pix',
    'cash',
    'card',
    'online'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'failed',
    'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.coupon_type as enum (
    'percentage',
    'fixed',
    'free_shipping'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.driver_status as enum (
    'offline',
    'available',
    'busy'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'order_update',
    'promotion',
    'system'
  );
exception when duplicate_object then null; end $$;


-- ─── 0002_core_tables.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0002 · Tabelas core: roles, profiles, restaurants, restaurant_settings
-- =====================================================================

-- ─── roles (catálogo de papéis / metadados de permissão) ─────────────
create table if not exists public.roles (
  key         public.user_role primary key,
  label       text not null,
  description text
);

insert into public.roles (key, label, description) values
  ('master_admin', 'Master Admin', 'Gerencia toda a plataforma'),
  ('restaurant',   'Restaurante',  'Gerencia seu próprio estabelecimento'),
  ('customer',     'Cliente',      'Faz pedidos e acompanha entregas'),
  ('driver',       'Entregador',   'Realiza entregas')
on conflict (key) do nothing;

-- ─── profiles (espelha auth.users) ───────────────────────────────────
-- restaurant_id: para usuários do tipo 'restaurant'/'driver', indica a
-- qual estabelecimento pertencem (base do isolamento multi-tenant).
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.user_role not null default 'customer',
  restaurant_id uuid, -- FK adicionada após restaurants (abaixo)
  full_name     text not null default '',
  email         citext,
  phone         text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── restaurants ─────────────────────────────────────────────────────
create table if not exists public.restaurants (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references public.profiles (id) on delete set null,
  name         text not null,
  slug         text not null unique,
  description  text,
  logo_url     text,
  cover_url    text,
  cuisine      text not null default 'Italiana',
  phone        text,
  email        citext,
  status       public.restaurant_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- agora podemos amarrar profiles.restaurant_id
do $$ begin
  alter table public.profiles
    add constraint profiles_restaurant_id_fkey
    foreign key (restaurant_id) references public.restaurants (id) on delete set null;
exception when duplicate_object then null; end $$;

-- ─── restaurant_settings (1:1 com restaurants) ───────────────────────
create table if not exists public.restaurant_settings (
  restaurant_id        uuid primary key references public.restaurants (id) on delete cascade,
  is_open              boolean not null default true,
  accepts_delivery     boolean not null default true,
  accepts_pickup       boolean not null default true,
  accepts_dine_in      boolean not null default false,
  delivery_fee_cents   integer not null default 0 check (delivery_fee_cents >= 0),
  free_delivery_above_cents integer check (free_delivery_above_cents >= 0),
  min_order_cents      integer not null default 0 check (min_order_cents >= 0),
  delivery_radius_km   numeric(5,2) not null default 5 check (delivery_radius_km >= 0),
  avg_prep_minutes     integer not null default 40 check (avg_prep_minutes >= 0),
  -- horários de funcionamento por dia (0=domingo .. 6=sábado)
  -- formato: { "1": { "open": "18:00", "close": "23:00", "enabled": true }, ... }
  opening_hours        jsonb not null default '{}'::jsonb,
  -- métodos de pagamento aceitos
  payment_methods      public.payment_method[] not null default array['pix','cash','card']::public.payment_method[],
  address_street       text,
  address_number       text,
  address_district     text,
  address_city         text,
  address_state        text,
  address_zip          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);


-- ─── 0003_catalog.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0003 · Catálogo: categories, products, product_images
-- =====================================================================

create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name          text not null,
  slug          text not null,
  description   text,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants (id) on delete cascade,
  category_id     uuid references public.categories (id) on delete set null,
  name            text not null,
  slug            text not null,
  description     text,
  image_url       text,                 -- imagem principal (atalho)
  price_cents     integer not null check (price_cents >= 0),
  promo_price_cents integer check (promo_price_cents >= 0),
  is_available    boolean not null default true,
  is_featured     boolean not null default false,
  sort_order      integer not null default 0,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (restaurant_id, slug),
  -- preço promocional, quando existe, deve ser menor que o preço cheio
  constraint promo_lt_price check (
    promo_price_cents is null or promo_price_cents < price_cents
  )
);

-- galeria de imagens adicionais por produto
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);


-- ─── 0004_customers_delivery.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0004 · Clientes e delivery: customers, addresses, drivers,
--        favorites, reviews
-- =====================================================================

-- customer: dados de negócio do cliente (1:1 com profile do tipo customer)
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null unique references public.profiles (id) on delete cascade,
  loyalty_points  integer not null default 0 check (loyalty_points >= 0),
  total_orders    integer not null default 0,
  total_spent_cents integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.addresses (
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

create table if not exists public.drivers (
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
create table if not exists public.favorites (
  customer_id  uuid not null references public.customers (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (customer_id, product_id)
);

-- avaliações do restaurante (e, opcionalmente, do pedido)
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  customer_id   uuid not null references public.customers (id) on delete cascade,
  order_id      uuid, -- FK adicionada em 0005 (orders ainda não existe)
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now(),
  unique (customer_id, order_id)
);


-- ─── 0005_orders_coupons.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0005 · Pedidos, pagamentos, cupons e notificações
--        orders, order_items, payments, coupons, coupon_usage, notifications
-- =====================================================================

create table if not exists public.coupons (
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

create table if not exists public.orders (
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
create table if not exists public.order_items (
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

create table if not exists public.payments (
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

create table if not exists public.coupon_usage (
  id            uuid primary key default gen_random_uuid(),
  coupon_id     uuid not null references public.coupons (id) on delete cascade,
  customer_id   uuid references public.customers (id) on delete set null,
  order_id      uuid references public.orders (id) on delete cascade,
  discount_cents integer not null default 0,
  used_at       timestamptz not null default now()
);

create table if not exists public.notifications (
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
do $$ begin
  alter table public.reviews
    add constraint reviews_order_id_fkey
    foreign key (order_id) references public.orders (id) on delete set null;
exception when duplicate_object then null; end $$;


-- ─── 0006_indexes.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0006 · Índices para performance (multi-tenant filtra sempre por
--        restaurant_id; orders por status/data; busca textual)
-- =====================================================================

-- profiles
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_restaurant on public.profiles (restaurant_id);

-- restaurants
create index if not exists idx_restaurants_status on public.restaurants (status);

-- catálogo
create index if not exists idx_categories_restaurant on public.categories (restaurant_id);
create index if not exists idx_categories_active on public.categories (restaurant_id, is_active) where deleted_at is null;

create index if not exists idx_products_restaurant on public.products (restaurant_id);
create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_products_available on public.products (restaurant_id, is_available) where deleted_at is null;
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);

-- clientes / delivery
create index if not exists idx_addresses_customer on public.addresses (customer_id);
create index if not exists idx_drivers_restaurant on public.drivers (restaurant_id);
create index if not exists idx_drivers_status on public.drivers (status);

-- pedidos (consultas mais quentes do KDS e relatórios)
create index if not exists idx_orders_restaurant on public.orders (restaurant_id);
create index if not exists idx_orders_status on public.orders (restaurant_id, status);
create index if not exists idx_orders_customer on public.orders (customer_id);
create index if not exists idx_orders_driver on public.orders (driver_id);
create index if not exists idx_orders_created on public.orders (restaurant_id, created_at desc);

create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_order_items_product on public.order_items (product_id);

-- pagamentos / cupons
create index if not exists idx_payments_order on public.payments (order_id);
create index if not exists idx_coupons_restaurant on public.coupons (restaurant_id);
create index if not exists idx_coupon_usage_coupon on public.coupon_usage (coupon_id);

-- notificações
create index if not exists idx_notifications_user on public.notifications (user_id, read_at);

-- avaliações
create index if not exists idx_reviews_restaurant on public.reviews (restaurant_id);


-- ─── 0007_functions_triggers.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0007 · Funções helper (RLS), triggers de updated_at e
--        provisionamento automático de profile no signup
-- =====================================================================

-- ─── updated_at automático ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','restaurants','restaurant_settings','categories','products',
    'customers','addresses','drivers','coupons','orders','payments'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ─── Funções de contexto para RLS ────────────────────────────────────
-- Lê o papel do usuário autenticado (security definer evita recursão RLS).

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'master_admin'
  );
$$;

-- restaurant_id ao qual o usuário autenticado pertence (restaurant/driver)
create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.profiles where id = auth.uid();
$$;

-- customer_id do usuário autenticado (se for cliente)
create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.customers where profile_id = auth.uid();
$$;

-- ─── Provisionamento automático no signup ────────────────────────────
-- Ao criar um auth.user, cria o profile (role vem do metadata, default customer)
-- e, se for cliente, também cria o registro em customers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'customer'
  );

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );

  if v_role = 'customer' then
    insert into public.customers (profile_id) values (new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Recalcular total de um pedido a partir dos itens ────────────────
create or replace function public.recalc_order_totals(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  v_subtotal integer;
begin
  select coalesce(sum(total_cents), 0) into v_subtotal
  from public.order_items where order_id = p_order_id;

  update public.orders
  set subtotal_cents = v_subtotal,
      total_cents = greatest(0, v_subtotal + delivery_fee_cents - discount_cents)
  where id = p_order_id;
end;
$$;


-- ─── 0008_rls_policies.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0008 · Row Level Security — isolamento multi-tenant e por persona
-- Regra de ouro: a segurança vive no banco. service_role (server) ignora RLS.
-- =====================================================================

-- helper extra: driver_id do usuário autenticado
create or replace function public.current_driver_id()
returns uuid
language sql stable security definer set search_path = public
as $$ select id from public.drivers where profile_id = auth.uid(); $$;

-- Habilita RLS em todas as tabelas
alter table public.roles                enable row level security;
alter table public.profiles             enable row level security;
alter table public.restaurants          enable row level security;
alter table public.restaurant_settings  enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_images       enable row level security;
alter table public.customers            enable row level security;
alter table public.addresses            enable row level security;
alter table public.drivers              enable row level security;
alter table public.favorites            enable row level security;
alter table public.reviews              enable row level security;
alter table public.coupons              enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.payments             enable row level security;
alter table public.coupon_usage         enable row level security;
alter table public.notifications        enable row level security;

-- ─── roles (catálogo público de leitura) ─────────────────────────────
drop policy if exists "roles_read_all" on public.roles;
create policy "roles_read_all" on public.roles
  for select using (true);

-- ─── profiles ────────────────────────────────────────────────────────
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_master_admin()
    or (restaurant_id is not null and restaurant_id = public.current_restaurant_id())
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_master_admin())
  with check (id = auth.uid() or public.is_master_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_master_admin());

-- ─── restaurants ─────────────────────────────────────────────────────
drop policy if exists "restaurants_select" on public.restaurants;
create policy "restaurants_select" on public.restaurants
  for select using (
    status = 'active'
    or owner_id = auth.uid()
    or id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "restaurants_insert" on public.restaurants;
create policy "restaurants_insert" on public.restaurants
  for insert with check (owner_id = auth.uid() or public.is_master_admin());

drop policy if exists "restaurants_update" on public.restaurants;
create policy "restaurants_update" on public.restaurants
  for update using (
    owner_id = auth.uid()
    or id = public.current_restaurant_id()
    or public.is_master_admin()
  )
  with check (
    owner_id = auth.uid()
    or id = public.current_restaurant_id()
    or public.is_master_admin()
  );

-- ─── restaurant_settings ─────────────────────────────────────────────
drop policy if exists "settings_select" on public.restaurant_settings;
create policy "settings_select" on public.restaurant_settings
  for select using (
    restaurant_id in (select id from public.restaurants where status = 'active')
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "settings_write" on public.restaurant_settings;
create policy "settings_write" on public.restaurant_settings
  for all using (
    restaurant_id = public.current_restaurant_id() or public.is_master_admin()
  )
  with check (
    restaurant_id = public.current_restaurant_id() or public.is_master_admin()
  );

-- ─── helper macro de leitura pública de restaurante ativo ────────────
-- (categorias/produtos públicos quando o restaurante está ativo)

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (
    (deleted_at is null
      and restaurant_id in (select id from public.restaurants where status = 'active'))
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "categories_write" on public.categories;
create policy "categories_write" on public.categories
  for all using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (
    (deleted_at is null
      and restaurant_id in (select id from public.restaurants where status = 'active'))
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "products_write" on public.products;
create policy "products_write" on public.products
  for all using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

drop policy if exists "product_images_read" on public.product_images;
create policy "product_images_read" on public.product_images
  for select using (
    product_id in (select id from public.products) -- visibilidade herda de products via RLS
  );

drop policy if exists "product_images_write" on public.product_images;
create policy "product_images_write" on public.product_images
  for all using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (p.restaurant_id = public.current_restaurant_id() or public.is_master_admin())
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (p.restaurant_id = public.current_restaurant_id() or public.is_master_admin())
    )
  );

-- ─── customers ───────────────────────────────────────────────────────
drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own" on public.customers
  for select using (profile_id = auth.uid() or public.is_master_admin());

drop policy if exists "customers_update_own" on public.customers;
create policy "customers_update_own" on public.customers
  for update using (profile_id = auth.uid() or public.is_master_admin())
  with check (profile_id = auth.uid() or public.is_master_admin());

-- ─── addresses ───────────────────────────────────────────────────────
drop policy if exists "addresses_own" on public.addresses;
create policy "addresses_own" on public.addresses
  for all using (customer_id = public.current_customer_id() or public.is_master_admin())
  with check (customer_id = public.current_customer_id() or public.is_master_admin());

-- ─── drivers ─────────────────────────────────────────────────────────
drop policy if exists "drivers_select" on public.drivers;
create policy "drivers_select" on public.drivers
  for select using (
    profile_id = auth.uid()
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "drivers_update" on public.drivers;
create policy "drivers_update" on public.drivers
  for update using (
    profile_id = auth.uid()
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  )
  with check (
    profile_id = auth.uid()
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

-- ─── favorites ───────────────────────────────────────────────────────
drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites
  for all using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

-- ─── reviews ─────────────────────────────────────────────────────────
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (customer_id = public.current_customer_id());

drop policy if exists "reviews_modify_own" on public.reviews;
create policy "reviews_modify_own" on public.reviews
  for update using (customer_id = public.current_customer_id() or public.is_master_admin())
  with check (customer_id = public.current_customer_id() or public.is_master_admin());

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (customer_id = public.current_customer_id() or public.is_master_admin());

-- ─── coupons (apenas staff/master; validação pública via server action) ─
drop policy if exists "coupons_staff" on public.coupons;
create policy "coupons_staff" on public.coupons
  for all using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

-- ─── orders ──────────────────────────────────────────────────────────
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (
    customer_id = public.current_customer_id()
    or restaurant_id = public.current_restaurant_id()
    or driver_id = public.current_driver_id()
    or public.is_master_admin()
  );

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders
  for insert with check (
    customer_id = public.current_customer_id()
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders
  for update using (
    restaurant_id = public.current_restaurant_id()
    or driver_id = public.current_driver_id()
    or public.is_master_admin()
  )
  with check (
    restaurant_id = public.current_restaurant_id()
    or driver_id = public.current_driver_id()
    or public.is_master_admin()
  );

-- ─── order_items (visibilidade herda do pedido) ──────────────────────
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select using (
    order_id in (
      select id from public.orders
      where customer_id = public.current_customer_id()
         or restaurant_id = public.current_restaurant_id()
         or driver_id = public.current_driver_id()
         or public.is_master_admin()
    )
  );

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
  for insert with check (
    order_id in (
      select id from public.orders
      where customer_id = public.current_customer_id()
         or restaurant_id = public.current_restaurant_id()
         or public.is_master_admin()
    )
  );

-- ─── payments ────────────────────────────────────────────────────────
drop policy if exists "payments_access" on public.payments;
create policy "payments_access" on public.payments
  for all using (
    order_id in (
      select id from public.orders
      where customer_id = public.current_customer_id()
         or restaurant_id = public.current_restaurant_id()
         or public.is_master_admin()
    )
  )
  with check (
    order_id in (
      select id from public.orders
      where customer_id = public.current_customer_id()
         or restaurant_id = public.current_restaurant_id()
         or public.is_master_admin()
    )
  );

-- ─── coupon_usage ────────────────────────────────────────────────────
drop policy if exists "coupon_usage_access" on public.coupon_usage;
create policy "coupon_usage_access" on public.coupon_usage
  for all using (
    customer_id = public.current_customer_id()
    or coupon_id in (select id from public.coupons where restaurant_id = public.current_restaurant_id())
    or public.is_master_admin()
  )
  with check (
    customer_id = public.current_customer_id()
    or coupon_id in (select id from public.coupons where restaurant_id = public.current_restaurant_id())
    or public.is_master_admin()
  );

-- ─── notifications ───────────────────────────────────────────────────
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
  for select using (user_id = auth.uid() or public.is_master_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─── 0009_storage.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0009 · Storage buckets e policies (imagens de produtos / restaurante)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('restaurant-assets', 'restaurant-assets', true)
on conflict (id) do nothing;

-- Leitura pública das imagens
drop policy if exists "public_read_product_images" on storage.objects;
create policy "public_read_product_images" on storage.objects
  for select using (bucket_id in ('product-images', 'restaurant-assets'));

-- Upload/edição/remoção apenas por usuários autenticados de restaurante/master.
-- (validação fina do tenant é feita na camada de aplicação via path = restaurant_id/...)
drop policy if exists "staff_write_product_images" on storage.objects;
create policy "staff_write_product_images" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'restaurant-assets'));

drop policy if exists "staff_update_product_images" on storage.objects;
create policy "staff_update_product_images" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'restaurant-assets'));

drop policy if exists "staff_delete_product_images" on storage.objects;
create policy "staff_delete_product_images" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'restaurant-assets'));


-- ─── 0010_realtime.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0010 · Habilita Realtime (Postgres changes) nas tabelas necessárias
-- =====================================================================

-- KDS (cozinha) e tracking do cliente dependem de mudanças em orders.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_items'
  ) then
    alter publication supabase_realtime add table public.order_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;


-- ─── 0011_enums_extended.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0011 · Enums estendidos
--   • user_role       → staff, moderator
--   • order_status    → payment_pending
--   • Novos enums:    onboarding_status, driver_approval_status,
--                     post_type, image_source, ticket_status,
--                     refund_status, option_type, audit_action
-- =====================================================================

-- ─── user_role ────────────────────────────────────────────────────────
alter type public.user_role add value if not exists 'staff';
alter type public.user_role add value if not exists 'moderator';

-- ─── order_status ─────────────────────────────────────────────────────
-- payment_pending: aguardando confirmação de pagamento (antes de received)
alter type public.order_status add value if not exists 'payment_pending';

-- ─── onboarding_status ────────────────────────────────────────────────
-- Estado do processo de aprovação do restaurante
do $$ begin
  create type public.onboarding_status as enum (
    'draft',       -- preenchendo cadastro
    'in_review',   -- documentos enviados, aguardando análise
    'approved',    -- aprovado e ativo
    'rejected'     -- recusado (com motivo)
  );
exception when duplicate_object then null; end $$;

-- ─── driver_approval_status ───────────────────────────────────────────
do $$ begin
  create type public.driver_approval_status as enum (
    'pending',     -- cadastro enviado
    'approved',    -- entregador aprovado
    'rejected',    -- documentos recusados
    'suspended'    -- suspenso temporariamente
  );
exception when duplicate_object then null; end $$;

-- ─── post_type ────────────────────────────────────────────────────────
do $$ begin
  create type public.post_type as enum (
    'photo',
    'text',
    'video',
    'story'
  );
exception when duplicate_object then null; end $$;

-- ─── image_source ─────────────────────────────────────────────────────
do $$ begin
  create type public.image_source as enum (
    'upload',        -- enviado pelo restaurante
    'nenos_studio'   -- escolhido da biblioteca Nenos Studio
  );
exception when duplicate_object then null; end $$;

-- ─── ticket_status ────────────────────────────────────────────────────
do $$ begin
  create type public.ticket_status as enum (
    'open',
    'in_progress',
    'resolved',
    'closed'
  );
exception when duplicate_object then null; end $$;

-- ─── refund_status ────────────────────────────────────────────────────
do $$ begin
  create type public.refund_status as enum (
    'requested',
    'approved',
    'rejected',
    'processed'
  );
exception when duplicate_object then null; end $$;

-- ─── option_type ──────────────────────────────────────────────────────
-- single: apenas 1 item selecionável (ex: tamanho) / multiple: N itens
do $$ begin
  create type public.option_type as enum (
    'single',
    'multiple'
  );
exception when duplicate_object then null; end $$;

-- ─── audit_action ─────────────────────────────────────────────────────
do $$ begin
  create type public.audit_action as enum (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'approve',
    'reject',
    'suspend',
    'restore'
  );
exception when duplicate_object then null; end $$;


-- ─── 0012_restaurants_extended.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0012 · Restaurantes estendidos
--   • Novas colunas em restaurants (cadastro completo, onboarding)
--   • restaurant_staff  — membros da equipe do restaurante
--   • restaurant_documents — documentos (CNPJ, alvará, etc.) — PRIVADO
--   • restaurant_followers — clientes que seguem o restaurante
-- =====================================================================

-- ─── restaurants: novas colunas ──────────────────────────────────────
alter table public.restaurants
  add column if not exists cnpj                text unique,
  add column if not exists whatsapp            text,
  add column if not exists instagram           text,
  add column if not exists website             text,
  add column if not exists history             text,           -- história/sobre
  add column if not exists chef_name           text,
  add column if not exists price_range         smallint check (price_range between 1 and 4),
  add column if not exists establishment_type  text not null default 'restaurant',
  add column if not exists onboarding_status   public.onboarding_status not null default 'draft',
  add column if not exists registration_step   smallint not null default 1 check (registration_step between 1 and 4),
  add column if not exists rejection_reason    text,          -- motivo de recusa
  add column if not exists avg_rating          numeric(3,2) not null default 0 check (avg_rating between 0 and 5),
  add column if not exists total_reviews       integer not null default 0 check (total_reviews >= 0),
  add column if not exists total_orders        integer not null default 0 check (total_orders >= 0),
  add column if not exists is_verified         boolean not null default false,
  add column if not exists approved_at         timestamptz,
  add column if not exists approved_by         uuid references public.profiles (id) on delete set null;

-- ─── restaurant_staff ────────────────────────────────────────────────
-- Membros da equipe: caixa, gerente, atendente, cozinheiro, etc.
create table if not exists public.restaurant_staff (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  job_title     text not null default 'staff',  -- gerente, caixa, atendente...
  permissions   text[] not null default '{}',   -- lista de permissões granulares (futuro)
  is_active     boolean not null default true,
  invited_by    uuid references public.profiles (id) on delete set null,
  invited_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, profile_id)
);

-- ─── restaurant_documents ────────────────────────────────────────────
-- Documentos jurídicos — bucket PRIVADO, acesso via signed URL.
create table if not exists public.restaurant_documents (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  doc_type      text not null,   -- cnpj_card, social_contract, health_permit, menu_photo...
  storage_path  text not null,   -- path dentro do bucket privado
  original_name text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── restaurant_followers ────────────────────────────────────────────
create table if not exists public.restaurant_followers (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (restaurant_id, profile_id)
);

-- ─── Trigger updated_at ──────────────────────────────────────────────
drop trigger if exists trg_restaurant_staff_updated_at on public.restaurant_staff;
create trigger trg_restaurant_staff_updated_at
  before update on public.restaurant_staff
  for each row execute function public.set_updated_at();

drop trigger if exists trg_restaurant_documents_updated_at on public.restaurant_documents;
create trigger trg_restaurant_documents_updated_at
  before update on public.restaurant_documents
  for each row execute function public.set_updated_at();

-- ─── Função helper: is_restaurant_staff ──────────────────────────────
-- Retorna true se o usuário autenticado é staff do restaurante em questão.
create or replace function public.is_restaurant_staff(p_restaurant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.restaurant_staff
    where restaurant_id = p_restaurant_id
      and profile_id    = auth.uid()
      and is_active     = true
  );
$$;


-- ─── 0013_social.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0013 · Rede Social (Nenos Comunidade)
--   • posts            — publicações dos restaurantes
--   • post_images      — galeria de imagens do post
--   • post_likes       — curtidas (M:N profile <-> post)
--   • post_comments    — comentários (com suporte a respostas)
--   • post_saves       — posts salvos pelo cliente
--   • post_reports     — denúncias de conteúdo
-- =====================================================================

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants (id) on delete cascade,
  author_id       uuid not null references public.profiles (id) on delete cascade,
  type            public.post_type not null default 'photo',
  caption         text,
  is_pinned       boolean not null default false,
  likes_count     integer not null default 0 check (likes_count >= 0),
  comments_count  integer not null default 0 check (comments_count >= 0),
  saves_count     integer not null default 0 check (saves_count >= 0),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.post_images (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  url         text not null,
  alt         text,
  width       integer,
  height      integer,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- M:N: um profile curte um post (one row per like)
create table if not exists public.post_likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.post_comments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts (id) on delete cascade,
  author_id     uuid not null references public.profiles (id) on delete cascade,
  parent_id     uuid references public.post_comments (id) on delete cascade, -- resposta
  body          text not null,
  likes_count   integer not null default 0 check (likes_count >= 0),
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Posts salvos pelo usuário (bookmarks)
create table if not exists public.post_saves (
  post_id     uuid not null references public.posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.post_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,       -- spam, inappropriate, fake...
  detail      text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)    -- 1 denúncia por pessoa por post
);

-- ─── Triggers ────────────────────────────────────────────────────────
drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_post_comments_updated_at on public.post_comments;
create trigger trg_post_comments_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();

-- ─── Counters denormalizados (via trigger) ────────────────────────────
-- likes_count em posts
create or replace function public.sync_post_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_likes_count on public.post_likes;
create trigger trg_post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

-- comments_count em posts
create or replace function public.sync_post_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null) then
    update public.posts set comments_count = greatest(0, comments_count - 1) where id = coalesce(new.post_id, old.post_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_comments_count on public.post_comments;
create trigger trg_post_comments_count
  after insert or delete or update of deleted_at on public.post_comments
  for each row execute function public.sync_post_comments_count();

-- saves_count em posts
create or replace function public.sync_post_saves_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set saves_count = saves_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set saves_count = greatest(0, saves_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_saves_count on public.post_saves;
create trigger trg_post_saves_count
  after insert or delete on public.post_saves
  for each row execute function public.sync_post_saves_count();


-- ─── 0014_drivers_extended.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0014 · Entregadores estendidos
--   • Novas colunas em drivers (dados pessoais, financeiros, aprovação)
--   • driver_documents  — docs de habilitação/identidade — PRIVADO
--   • driver_vehicles   — veículos cadastrados
--   • driver_verifications — checagem de documentos pelo admin
--   • driver_locations  — histórico de posição (GPS)
-- =====================================================================

-- ─── drivers: novas colunas ──────────────────────────────────────────
alter table public.drivers
  add column if not exists cpf                       text unique,
  add column if not exists birth_date                date,
  add column if not exists approval_status           public.driver_approval_status not null default 'pending',
  add column if not exists rejection_reason          text,
  add column if not exists suspension_reason         text,
  add column if not exists suspended_until           timestamptz,
  -- Chave Pix para repasse de ganhos
  add column if not exists pix_key                   text,
  add column if not exists pix_key_type              text check (pix_key_type in ('cpf','email','phone','random','cnpj')),
  add column if not exists bank_name                 text,
  add column if not exists bank_agency               text,
  add column if not exists bank_account              text,
  -- Contato de emergência
  add column if not exists emergency_contact_name    text,
  add column if not exists emergency_contact_phone   text,
  -- Localização em tempo real (snapshot)
  add column if not exists current_latitude          numeric(10,7),
  add column if not exists current_longitude         numeric(10,7),
  add column if not exists current_heading           numeric(5,2),
  add column if not exists last_location_at          timestamptz,
  -- Aprovação
  add column if not exists approved_at               timestamptz,
  add column if not exists approved_by               uuid references public.profiles (id) on delete set null;

-- ─── driver_documents ────────────────────────────────────────────────
-- Bucket PRIVADO: driver-docs/<driver_id>/<doc_type>/<filename>
-- Acesso via signed URL gerada pelo service_role.
create table if not exists public.driver_documents (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references public.drivers (id) on delete cascade,
  doc_type      text not null,  -- cnh_front, cnh_back, id_front, id_back, selfie, proof_of_address
  storage_path  text not null,  -- path no bucket privado
  original_name text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  expires_at    timestamptz,    -- para CNH e docs com validade
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── driver_vehicles ─────────────────────────────────────────────────
create table if not exists public.driver_vehicles (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  type        text not null default 'motorcycle', -- motorcycle, bicycle, car, van
  brand       text,
  model       text,
  year        smallint check (year between 1970 and 2100),
  color       text,
  plate       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── driver_verifications ────────────────────────────────────────────
-- Checklist de verificação por parte do admin (antecedentes, docs, etc.)
create table if not exists public.driver_verifications (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references public.drivers (id) on delete cascade,
  check_type    text not null,  -- background_check, cnh_valid, address_confirmed...
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes         text,
  verified_by   uuid references public.profiles (id) on delete set null,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ─── driver_locations ────────────────────────────────────────────────
-- Histórico de posições — gravado enquanto entregador está em status 'busy'
-- Retido por 30 dias (pode ser limpo por job agendado)
create table if not exists public.driver_locations (
  id          bigint generated always as identity primary key,
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  latitude    numeric(10,7) not null,
  longitude   numeric(10,7) not null,
  heading     numeric(5,2),   -- direção em graus (0–359)
  speed       numeric(6,2),   -- km/h
  created_at  timestamptz not null default now()
);

-- ─── Triggers ────────────────────────────────────────────────────────
drop trigger if exists trg_driver_documents_updated_at on public.driver_documents;
create trigger trg_driver_documents_updated_at
  before update on public.driver_documents
  for each row execute function public.set_updated_at();

drop trigger if exists trg_driver_vehicles_updated_at on public.driver_vehicles;
create trigger trg_driver_vehicles_updated_at
  before update on public.driver_vehicles
  for each row execute function public.set_updated_at();

-- ─── Helper: current_driver_id já existe em 0008, mantido ────────────


-- ─── 0015_delivery_extended.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0015 · Delivery estendido
--   • order_status_history  — log de mudanças de status do pedido
--   • delivery_tracking     — posições GPS do entregador por pedido
--   • delivery_codes        — código de confirmação de entrega (PIN/QR)
--   • Novas colunas em orders (timestamps extras)
-- =====================================================================

-- ─── orders: timestamps adicionais ───────────────────────────────────
alter table public.orders
  add column if not exists prepared_at   timestamptz,  -- saiu da cozinha
  add column if not exists picked_up_at  timestamptz,  -- entregador coletou
  add column if not exists rated_at      timestamptz;  -- cliente avaliou

-- ─── order_status_history ────────────────────────────────────────────
-- Log imutável de todas as transições de status do pedido.
create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  changed_by  uuid references public.profiles (id) on delete set null, -- quem mudou (null = sistema)
  notes       text,
  created_at  timestamptz not null default now()
);

-- Trigger: ao atualizar status do pedido, registra histórico automaticamente
create or replace function public.record_order_status_change()
returns trigger language plpgsql as $$
begin
  if new.status <> old.status then
    insert into public.order_status_history (order_id, status, created_at)
    values (new.id, new.status, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_status_history on public.orders;
create trigger trg_order_status_history
  after update of status on public.orders
  for each row execute function public.record_order_status_change();

-- ─── delivery_tracking ───────────────────────────────────────────────
-- Snapshot de posição do entregador durante a entrega de UM pedido específico.
-- Retido por 90 dias.
create table if not exists public.delivery_tracking (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  latitude    numeric(10,7) not null,
  longitude   numeric(10,7) not null,
  heading     numeric(5,2),
  speed       numeric(6,2),
  created_at  timestamptz not null default now()
);

-- ─── delivery_codes ──────────────────────────────────────────────────
-- Código de 4–6 dígitos (ou token) para confirmar a entrega ao cliente.
-- O entregador insere o código que o cliente mostra.
create table if not exists public.delivery_codes (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null unique references public.orders (id) on delete cascade,
  code          text not null,
  confirmed_at  timestamptz,
  confirmed_by  uuid references public.drivers (id) on delete set null,
  expires_at    timestamptz not null default (now() + interval '48 hours'),
  created_at    timestamptz not null default now()
);

-- ─── Storage bucket privado para documentos ──────────────────────────
-- (executado aqui para manter a sequência; bucket policy via service_role)
insert into storage.buckets (id, name, public)
values ('driver-docs', 'driver-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('restaurant-docs', 'restaurant-docs', false)
on conflict (id) do nothing;


-- ─── 0016_catalog_extended.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0016 · Catálogo estendido
--   • Novas colunas em products (flags dietéticos, estoque, preparo)
--   • product_options      — grupos de opções (tamanho, sabores, complementos)
--   • product_option_items — itens dentro de um grupo
--   • image_library        — Nenos Studio: biblioteca de imagens gastronômicas
-- =====================================================================

-- ─── products: novas colunas ─────────────────────────────────────────
alter table public.products
  add column if not exists is_vegetarian      boolean not null default false,
  add column if not exists is_vegan           boolean not null default false,
  add column if not exists has_gluten         boolean not null default false,
  add column if not exists has_lactose        boolean not null default false,
  add column if not exists allergens          text[] not null default '{}',
  add column if not exists prep_time_minutes  smallint check (prep_time_minutes >= 0),
  add column if not exists serves             smallint check (serves > 0),      -- porção p/ N pessoas
  add column if not exists daily_stock_limit  integer check (daily_stock_limit >= 0), -- null = ilimitado
  add column if not exists stock_remaining    integer check (stock_remaining >= 0),   -- reset diário
  add column if not exists weight_grams       integer check (weight_grams > 0),
  add column if not exists calories           integer check (calories >= 0);

-- ─── product_options ─────────────────────────────────────────────────
-- Grupo de opções (ex: "Tamanho", "Sabores", "Complementos extras")
create table if not exists public.product_options (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  name        text not null,                        -- "Tamanho", "Borda", "Extras"
  type        public.option_type not null default 'single',
  is_required boolean not null default false,
  min_qty     smallint not null default 0 check (min_qty >= 0),
  max_qty     smallint not null default 1 check (max_qty >= 1),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (min_qty <= max_qty)
);

-- ─── product_option_items ────────────────────────────────────────────
-- Itens dentro de um grupo (ex: "P", "M", "G" dentro de "Tamanho")
create table if not exists public.product_option_items (
  id            uuid primary key default gen_random_uuid(),
  option_id     uuid not null references public.product_options (id) on delete cascade,
  name          text not null,               -- "Pequeno", "Mussarela extra"
  price_cents   integer not null default 0 check (price_cents >= 0), -- 0 = incluso
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── order_item_options ──────────────────────────────────────────────
-- Snapshot dos complementos selecionados em cada item do pedido
create table if not exists public.order_item_options (
  id                   uuid primary key default gen_random_uuid(),
  order_item_id        uuid not null references public.order_items (id) on delete cascade,
  option_id            uuid references public.product_options (id) on delete set null,
  option_item_id       uuid references public.product_option_items (id) on delete set null,
  option_name          text not null,       -- snapshot
  option_item_name     text not null,       -- snapshot
  unit_price_cents     integer not null default 0 check (unit_price_cents >= 0),
  quantity             smallint not null default 1 check (quantity > 0),
  created_at           timestamptz not null default now()
);

-- ─── image_library (Nenos Studio) ────────────────────────────────────
-- Imagens gastronômicas prontas para uso pelos restaurantes.
-- source = nenos_studio → curadas pela equipe Nenos.
-- source = upload       → enviadas pelo próprio restaurante.
create table if not exists public.image_library (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete cascade, -- null = pública/nenos_studio
  url           text not null,
  thumbnail_url text,
  source        public.image_source not null default 'upload',
  category      text,                    -- pizza, burger, drinks, desserts...
  tags          text[] not null default '{}',
  is_approved   boolean not null default false, -- nenos_studio precisa de aprovação
  created_at    timestamptz not null default now()
);

-- ─── Triggers ────────────────────────────────────────────────────────
drop trigger if exists trg_product_options_updated_at on public.product_options;
create trigger trg_product_options_updated_at
  before update on public.product_options
  for each row execute function public.set_updated_at();

drop trigger if exists trg_product_option_items_updated_at on public.product_option_items;
create trigger trg_product_option_items_updated_at
  before update on public.product_option_items
  for each row execute function public.set_updated_at();


-- ─── 0017_admin_tools.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0017 · Ferramentas administrativas
--   • audit_logs       — trilha de auditoria imutável
--   • support_tickets  — chamados de suporte
--   • ticket_messages  — mensagens dentro de um chamado
--   • refunds          — solicitações de reembolso
-- =====================================================================

-- ─── audit_logs ──────────────────────────────────────────────────────
-- Log imutável. Nenhuma UPDATE/DELETE permitida via RLS.
-- Escrito apenas via service_role (server actions) ou triggers.
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,  -- quem fez a ação
  action       public.audit_action not null,
  entity_type  text not null,          -- 'restaurant', 'driver', 'order', 'product'...
  entity_id    uuid,                   -- id da entidade afetada
  restaurant_id uuid references public.restaurants (id) on delete set null, -- contexto de tenant
  old_data     jsonb,                  -- snapshot antes
  new_data     jsonb,                  -- snapshot depois
  ip_addr      inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

-- ─── support_tickets ─────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles (id) on delete cascade,
  assigned_to   uuid references public.profiles (id) on delete set null, -- moderador/admin
  restaurant_id uuid references public.restaurants (id) on delete set null, -- contexto, se aplicável
  ticket_type   text not null default 'general', -- general, payment, delivery, account, content
  subject       text not null,
  body          text not null,
  status        public.ticket_status not null default 'open',
  priority      text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── ticket_messages ─────────────────────────────────────────────────
create table if not exists public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  is_internal boolean not null default false, -- nota interna (visível só para staff)
  created_at  timestamptz not null default now()
);

-- ─── refunds ─────────────────────────────────────────────────────────
create table if not exists public.refunds (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  requested_by    uuid not null references public.profiles (id) on delete cascade,
  approved_by     uuid references public.profiles (id) on delete set null,
  amount_cents    integer not null check (amount_cents > 0),
  reason          text not null,       -- produto errado, não entregue, qualidade...
  status          public.refund_status not null default 'requested',
  rejection_note  text,
  payment_ref     text,                -- id da transação de estorno no gateway
  processed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Triggers ────────────────────────────────────────────────────────
drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_refunds_updated_at on public.refunds;
create trigger trg_refunds_updated_at
  before update on public.refunds
  for each row execute function public.set_updated_at();


-- ─── 0018_rls_extended.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0018 · RLS para todas as tabelas novas (ETAPA 3)
--   Regra de ouro: segurança vive no banco. service_role ignora RLS.
--   Tabelas de documentos privados: acesso via service_role + signed URL.
-- =====================================================================

-- ─── Habilitar RLS ───────────────────────────────────────────────────
alter table public.restaurant_staff        enable row level security;
alter table public.restaurant_documents    enable row level security;
alter table public.restaurant_followers    enable row level security;
alter table public.posts                   enable row level security;
alter table public.post_images             enable row level security;
alter table public.post_likes              enable row level security;
alter table public.post_comments           enable row level security;
alter table public.post_saves              enable row level security;
alter table public.post_reports            enable row level security;
alter table public.driver_documents        enable row level security;
alter table public.driver_vehicles         enable row level security;
alter table public.driver_verifications    enable row level security;
alter table public.driver_locations        enable row level security;
alter table public.order_status_history    enable row level security;
alter table public.delivery_tracking       enable row level security;
alter table public.delivery_codes          enable row level security;
alter table public.product_options         enable row level security;
alter table public.product_option_items    enable row level security;
alter table public.order_item_options      enable row level security;
alter table public.image_library           enable row level security;
alter table public.audit_logs              enable row level security;
alter table public.support_tickets         enable row level security;
alter table public.ticket_messages         enable row level security;
alter table public.refunds                 enable row level security;

-- ─── restaurant_staff ────────────────────────────────────────────────
drop policy if exists "rstaff_select" on public.restaurant_staff;
create policy "rstaff_select" on public.restaurant_staff
  for select using (
    restaurant_id = public.current_restaurant_id()
    or profile_id = auth.uid()
    or public.is_master_admin()
  );

drop policy if exists "rstaff_insert" on public.restaurant_staff;
create policy "rstaff_insert" on public.restaurant_staff
  for insert with check (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "rstaff_update" on public.restaurant_staff;
create policy "rstaff_update" on public.restaurant_staff
  for update using (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  )
  with check (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "rstaff_delete" on public.restaurant_staff;
create policy "rstaff_delete" on public.restaurant_staff
  for delete using (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

-- ─── restaurant_documents (privados — service_role para signed URL) ──
drop policy if exists "rdocs_select" on public.restaurant_documents;
create policy "rdocs_select" on public.restaurant_documents
  for select using (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "rdocs_write" on public.restaurant_documents;
create policy "rdocs_write" on public.restaurant_documents
  for all using (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  )
  with check (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

-- ─── restaurant_followers ─────────────────────────────────────────────
-- Qualquer autenticado vê quem segue um restaurante (count público)
drop policy if exists "rfollowers_select" on public.restaurant_followers;
create policy "rfollowers_select" on public.restaurant_followers
  for select using (true);

drop policy if exists "rfollowers_write" on public.restaurant_followers;
create policy "rfollowers_write" on public.restaurant_followers
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ─── posts ───────────────────────────────────────────────────────────
drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts
  for select using (
    deleted_at is null
    and (
      restaurant_id in (select id from public.restaurants where status = 'active')
      or restaurant_id = public.current_restaurant_id()
      or public.is_master_admin()
    )
  );

drop policy if exists "posts_write" on public.posts;
create policy "posts_write" on public.posts
  for all using (
    restaurant_id = public.current_restaurant_id()
    or author_id = auth.uid()
    or public.is_master_admin()
  )
  with check (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

-- ─── post_images ─────────────────────────────────────────────────────
drop policy if exists "post_images_read" on public.post_images;
create policy "post_images_read" on public.post_images
  for select using (
    post_id in (select id from public.posts where deleted_at is null)
  );

drop policy if exists "post_images_write" on public.post_images;
create policy "post_images_write" on public.post_images
  for all using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.restaurant_id = public.current_restaurant_id() or public.is_master_admin())
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.restaurant_id = public.current_restaurant_id() or public.is_master_admin())
    )
  );

-- ─── post_likes ──────────────────────────────────────────────────────
drop policy if exists "post_likes_read" on public.post_likes;
create policy "post_likes_read" on public.post_likes
  for select using (true);

drop policy if exists "post_likes_write" on public.post_likes;
create policy "post_likes_write" on public.post_likes
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ─── post_comments ───────────────────────────────────────────────────
drop policy if exists "post_comments_read" on public.post_comments;
create policy "post_comments_read" on public.post_comments
  for select using (deleted_at is null);

drop policy if exists "post_comments_insert" on public.post_comments;
create policy "post_comments_insert" on public.post_comments
  for insert with check (author_id = auth.uid());

drop policy if exists "post_comments_update" on public.post_comments;
create policy "post_comments_update" on public.post_comments
  for update using (author_id = auth.uid() or public.is_master_admin())
  with check (author_id = auth.uid() or public.is_master_admin());

drop policy if exists "post_comments_delete" on public.post_comments;
create policy "post_comments_delete" on public.post_comments
  for delete using (author_id = auth.uid() or public.is_master_admin());

-- ─── post_saves ──────────────────────────────────────────────────────
drop policy if exists "post_saves_own" on public.post_saves;
create policy "post_saves_own" on public.post_saves
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ─── post_reports ────────────────────────────────────────────────────
drop policy if exists "post_reports_insert" on public.post_reports;
create policy "post_reports_insert" on public.post_reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists "post_reports_admin" on public.post_reports;
create policy "post_reports_admin" on public.post_reports
  for select using (public.is_master_admin());

-- ─── driver_documents (privados) ──────────────────────────────────────
drop policy if exists "ddocs_select" on public.driver_documents;
create policy "ddocs_select" on public.driver_documents
  for select using (
    driver_id = public.current_driver_id()
    or public.is_master_admin()
  );

drop policy if exists "ddocs_write" on public.driver_documents;
create policy "ddocs_write" on public.driver_documents
  for all using (
    driver_id = public.current_driver_id()
    or public.is_master_admin()
  )
  with check (
    driver_id = public.current_driver_id()
    or public.is_master_admin()
  );

-- ─── driver_vehicles ─────────────────────────────────────────────────
drop policy if exists "dvehicles_select" on public.driver_vehicles;
create policy "dvehicles_select" on public.driver_vehicles
  for select using (
    driver_id = public.current_driver_id()
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and d.restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  );

drop policy if exists "dvehicles_write" on public.driver_vehicles;
create policy "dvehicles_write" on public.driver_vehicles
  for all using (driver_id = public.current_driver_id() or public.is_master_admin())
  with check (driver_id = public.current_driver_id() or public.is_master_admin());

-- ─── driver_verifications ────────────────────────────────────────────
drop policy if exists "dverif_select" on public.driver_verifications;
create policy "dverif_select" on public.driver_verifications
  for select using (
    driver_id = public.current_driver_id()
    or public.is_master_admin()
  );

drop policy if exists "dverif_admin_write" on public.driver_verifications;
create policy "dverif_admin_write" on public.driver_verifications
  for all using (public.is_master_admin())
  with check (public.is_master_admin());

-- ─── driver_locations ────────────────────────────────────────────────
drop policy if exists "dloc_insert" on public.driver_locations;
create policy "dloc_insert" on public.driver_locations
  for insert with check (driver_id = public.current_driver_id());

drop policy if exists "dloc_select" on public.driver_locations;
create policy "dloc_select" on public.driver_locations
  for select using (
    driver_id = public.current_driver_id()
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and d.restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  );

-- ─── order_status_history ────────────────────────────────────────────
drop policy if exists "osh_select" on public.order_status_history;
create policy "osh_select" on public.order_status_history
  for select using (
    order_id in (
      select id from public.orders
      where customer_id = public.current_customer_id()
         or restaurant_id = public.current_restaurant_id()
         or driver_id = public.current_driver_id()
         or public.is_master_admin()
    )
  );

-- ─── delivery_tracking ───────────────────────────────────────────────
drop policy if exists "dtrack_insert" on public.delivery_tracking;
create policy "dtrack_insert" on public.delivery_tracking
  for insert with check (driver_id = public.current_driver_id());

drop policy if exists "dtrack_select" on public.delivery_tracking;
create policy "dtrack_select" on public.delivery_tracking
  for select using (
    driver_id = public.current_driver_id()
    or order_id in (
      select id from public.orders
      where customer_id = public.current_customer_id()
         or restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  );

-- ─── delivery_codes ──────────────────────────────────────────────────
-- Código gerado pelo server (service_role). Cliente vê o próprio, entregador confirma.
drop policy if exists "dcodes_select" on public.delivery_codes;
create policy "dcodes_select" on public.delivery_codes
  for select using (
    order_id in (
      select id from public.orders
      where customer_id = public.current_customer_id()
         or driver_id = public.current_driver_id()
    )
    or public.is_master_admin()
  );

-- ─── product_options / product_option_items ──────────────────────────
drop policy if exists "poptions_public_read" on public.product_options;
create policy "poptions_public_read" on public.product_options
  for select using (
    product_id in (select id from public.products)
  );

drop policy if exists "poptions_write" on public.product_options;
create policy "poptions_write" on public.product_options
  for all using (
    product_id in (
      select id from public.products
      where restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  )
  with check (
    product_id in (
      select id from public.products
      where restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  );

drop policy if exists "poption_items_public_read" on public.product_option_items;
create policy "poption_items_public_read" on public.product_option_items
  for select using (
    option_id in (select id from public.product_options)
  );

drop policy if exists "poption_items_write" on public.product_option_items;
create policy "poption_items_write" on public.product_option_items
  for all using (
    option_id in (
      select po.id from public.product_options po
      join public.products p on p.id = po.product_id
      where p.restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  )
  with check (
    option_id in (
      select po.id from public.product_options po
      join public.products p on p.id = po.product_id
      where p.restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  );

-- ─── order_item_options (visibilidade herda do pedido) ───────────────
drop policy if exists "oio_select" on public.order_item_options;
create policy "oio_select" on public.order_item_options
  for select using (
    order_item_id in (
      select oi.id from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.customer_id = public.current_customer_id()
         or o.restaurant_id = public.current_restaurant_id()
         or o.driver_id = public.current_driver_id()
         or public.is_master_admin()
    )
  );

-- ─── image_library ───────────────────────────────────────────────────
drop policy if exists "imglib_public_read" on public.image_library;
create policy "imglib_public_read" on public.image_library
  for select using (
    is_approved = true
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

drop policy if exists "imglib_write" on public.image_library;
create policy "imglib_write" on public.image_library
  for all using (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  )
  with check (
    restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

-- ─── audit_logs (admin only; imutável) ───────────────────────────────
drop policy if exists "audit_admin_select" on public.audit_logs;
create policy "audit_admin_select" on public.audit_logs
  for select using (public.is_master_admin());

-- INSERT via service_role (sem política de insert — service_role ignora RLS)

-- ─── support_tickets ─────────────────────────────────────────────────
drop policy if exists "tickets_select" on public.support_tickets;
create policy "tickets_select" on public.support_tickets
  for select using (
    reporter_id = auth.uid()
    or assigned_to = auth.uid()
    or public.is_master_admin()
  );

drop policy if exists "tickets_insert" on public.support_tickets;
create policy "tickets_insert" on public.support_tickets
  for insert with check (reporter_id = auth.uid());

drop policy if exists "tickets_update" on public.support_tickets;
create policy "tickets_update" on public.support_tickets
  for update using (assigned_to = auth.uid() or public.is_master_admin())
  with check (assigned_to = auth.uid() or public.is_master_admin());

-- ─── ticket_messages ─────────────────────────────────────────────────
drop policy if exists "tmsg_select" on public.ticket_messages;
create policy "tmsg_select" on public.ticket_messages
  for select using (
    ticket_id in (
      select id from public.support_tickets
      where reporter_id = auth.uid()
         or assigned_to = auth.uid()
         or public.is_master_admin()
    )
    and (is_internal = false or public.is_master_admin())
  );

drop policy if exists "tmsg_insert" on public.ticket_messages;
create policy "tmsg_insert" on public.ticket_messages
  for insert with check (
    author_id = auth.uid()
    and ticket_id in (
      select id from public.support_tickets
      where reporter_id = auth.uid()
         or assigned_to = auth.uid()
         or public.is_master_admin()
    )
  );

-- ─── refunds ─────────────────────────────────────────────────────────
drop policy if exists "refunds_select" on public.refunds;
create policy "refunds_select" on public.refunds
  for select using (
    requested_by = auth.uid()
    or order_id in (
      select id from public.orders where restaurant_id = public.current_restaurant_id()
    )
    or public.is_master_admin()
  );

drop policy if exists "refunds_insert" on public.refunds;
create policy "refunds_insert" on public.refunds
  for insert with check (
    requested_by = auth.uid()
    or public.is_master_admin()
  );

drop policy if exists "refunds_update" on public.refunds;
create policy "refunds_update" on public.refunds
  for update using (public.is_master_admin())
  with check (public.is_master_admin());


-- ─── 0019_indexes_extended.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0019 · Índices de performance para tabelas novas (ETAPA 3)
-- =====================================================================

-- ─── restaurants estendidos ──────────────────────────────────────────
create index if not exists idx_restaurants_onboarding
  on public.restaurants (onboarding_status);

create index if not exists idx_restaurants_verified
  on public.restaurants (is_verified) where is_verified = true;

create index if not exists idx_restaurants_rating
  on public.restaurants (avg_rating desc);

-- ─── restaurant_staff ────────────────────────────────────────────────
create index if not exists idx_rstaff_restaurant
  on public.restaurant_staff (restaurant_id);

create index if not exists idx_rstaff_profile
  on public.restaurant_staff (profile_id);

create index if not exists idx_rstaff_active
  on public.restaurant_staff (restaurant_id, is_active) where is_active = true;

-- ─── restaurant_documents ────────────────────────────────────────────
create index if not exists idx_rdocs_restaurant
  on public.restaurant_documents (restaurant_id);

create index if not exists idx_rdocs_status
  on public.restaurant_documents (status);

-- ─── restaurant_followers ────────────────────────────────────────────
create index if not exists idx_rfollowers_restaurant
  on public.restaurant_followers (restaurant_id);

create index if not exists idx_rfollowers_profile
  on public.restaurant_followers (profile_id);

-- ─── posts ───────────────────────────────────────────────────────────
create index if not exists idx_posts_restaurant
  on public.posts (restaurant_id, created_at desc) where deleted_at is null;

create index if not exists idx_posts_author
  on public.posts (author_id);

create index if not exists idx_posts_pinned
  on public.posts (restaurant_id, is_pinned) where is_pinned = true and deleted_at is null;

-- ─── post_likes / comments / saves ───────────────────────────────────
create index if not exists idx_post_likes_post
  on public.post_likes (post_id);

create index if not exists idx_post_likes_profile
  on public.post_likes (profile_id);

create index if not exists idx_post_comments_post
  on public.post_comments (post_id) where deleted_at is null;

create index if not exists idx_post_comments_parent
  on public.post_comments (parent_id) where parent_id is not null;

create index if not exists idx_post_saves_profile
  on public.post_saves (profile_id);

-- ─── drivers estendidos ──────────────────────────────────────────────
create index if not exists idx_drivers_approval
  on public.drivers (approval_status);

create index if not exists idx_drivers_location
  on public.drivers (current_latitude, current_longitude)
  where current_latitude is not null;

-- ─── driver_documents ────────────────────────────────────────────────
create index if not exists idx_ddocs_driver
  on public.driver_documents (driver_id);

create index if not exists idx_ddocs_status
  on public.driver_documents (status);

-- ─── driver_locations ────────────────────────────────────────────────
create index if not exists idx_dloc_driver_time
  on public.driver_locations (driver_id, created_at desc);

-- ─── order_status_history ────────────────────────────────────────────
create index if not exists idx_osh_order
  on public.order_status_history (order_id, created_at desc);

-- ─── delivery_tracking ───────────────────────────────────────────────
create index if not exists idx_dtrack_order
  on public.delivery_tracking (order_id, created_at desc);

create index if not exists idx_dtrack_driver
  on public.delivery_tracking (driver_id, created_at desc);

-- ─── delivery_codes ──────────────────────────────────────────────────
create index if not exists idx_dcodes_order
  on public.delivery_codes (order_id);

-- ─── product_options / items ─────────────────────────────────────────
create index if not exists idx_poptions_product
  on public.product_options (product_id, sort_order);

create index if not exists idx_poption_items_option
  on public.product_option_items (option_id, sort_order);

-- ─── order_item_options ──────────────────────────────────────────────
create index if not exists idx_oio_order_item
  on public.order_item_options (order_item_id);

-- ─── image_library ───────────────────────────────────────────────────
create index if not exists idx_imglib_restaurant
  on public.image_library (restaurant_id);

create index if not exists idx_imglib_category
  on public.image_library (category) where is_approved = true;

create index if not exists idx_imglib_tags
  on public.image_library using gin (tags) where is_approved = true;

-- ─── audit_logs ──────────────────────────────────────────────────────
create index if not exists idx_audit_actor
  on public.audit_logs (actor_id, created_at desc);

create index if not exists idx_audit_entity
  on public.audit_logs (entity_type, entity_id);

create index if not exists idx_audit_restaurant
  on public.audit_logs (restaurant_id, created_at desc);

-- ─── support_tickets ─────────────────────────────────────────────────
create index if not exists idx_tickets_reporter
  on public.support_tickets (reporter_id);

create index if not exists idx_tickets_status
  on public.support_tickets (status, created_at desc);

create index if not exists idx_tickets_assigned
  on public.support_tickets (assigned_to) where assigned_to is not null;

-- ─── refunds ─────────────────────────────────────────────────────────
create index if not exists idx_refunds_order
  on public.refunds (order_id);

create index if not exists idx_refunds_status
  on public.refunds (status);


-- ─── 0020_user_features.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0020 · Funcionalidades de Usuário Final (ETAPA 5)
--   • restaurant_favorites  — favoritar restaurante (M:N customer <-> restaurant)
--   • reviews.reply         — resposta do restaurante à avaliação
-- =====================================================================

-- Favoritar restaurante (customer pode favoritar N restaurantes)
create table if not exists public.restaurant_favorites (
  customer_id   uuid not null references public.customers (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (customer_id, restaurant_id)
);

-- Resposta do restaurante à avaliação
alter table public.reviews
  add column if not exists reply       text,
  add column if not exists replied_at  timestamptz,
  add column if not exists replied_by  uuid references public.profiles (id) on delete set null;

-- RLS
alter table public.restaurant_favorites enable row level security;

drop policy if exists "rest_fav_own" on public.restaurant_favorites;
create policy "rest_fav_own"
  on public.restaurant_favorites
  using (
    customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

-- Índices
create index if not exists idx_rest_fav_customer
  on public.restaurant_favorites (customer_id);

create index if not exists idx_reviews_customer
  on public.reviews (customer_id);

create index if not exists idx_reviews_restaurant_rating
  on public.reviews (restaurant_id, rating);


-- ─── 0021_driver_onboarding.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0021 · Onboarding de Entregadores
--   • storage.objects policies para driver-docs
--   • Trigger: ao criar profile com role=driver, cria registro em drivers
-- =====================================================================

-- ─── Storage: driver-docs (bucket PRIVADO) ───────────────────────────
-- Entregador pode fazer upload e ler os próprios docs.
-- Admin (service_role) lê via signed URL gerada no servidor.

drop policy if exists "driver_docs_insert" on storage.objects;
create policy "driver_docs_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'driver-docs'
    and (storage.foldername(name))[1] = (
      select d.id::text
      from public.drivers d
      join public.profiles p on p.id = d.profile_id
      where p.id = auth.uid()
      limit 1
    )
  );

drop policy if exists "driver_docs_select" on storage.objects;
create policy "driver_docs_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'driver-docs'
    and (
      -- próprio entregador
      (storage.foldername(name))[1] = (
        select d.id::text
        from public.drivers d
        join public.profiles p on p.id = d.profile_id
        where p.id = auth.uid()
        limit 1
      )
      -- admin sempre pode ler
      or public.is_master_admin()
    )
  );

drop policy if exists "driver_docs_delete" on storage.objects;
create policy "driver_docs_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'driver-docs'
    and (
      (storage.foldername(name))[1] = (
        select d.id::text
        from public.drivers d
        join public.profiles p on p.id = d.profile_id
        where p.id = auth.uid()
        limit 1
      )
      or public.is_master_admin()
    )
  );

-- ─── Trigger: auto-create drivers record ─────────────────────────────
-- Extende handle_new_user: se role=driver, cria o registro na tabela drivers.
-- (handle_new_user já cria o profile; aqui só complementamos com o driver.)

create or replace function public.handle_new_driver()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'driver' then
    insert into public.drivers (profile_id, vehicle_type, status)
    values (new.id, 'motorcycle', 'offline')
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_driver_profile_created on public.profiles;
create trigger on_driver_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_driver();


-- ─── 0022_pagarme.sql ─────────────────────────────────────────────────────────

-- Pagar.me: recipient por restaurante + payload do gateway no pagamento
alter table public.restaurant_settings
  add column if not exists pagarme_recipient_id text;

alter table public.payments
  add column if not exists provider_payload jsonb;

comment on column public.restaurant_settings.pagarme_recipient_id is
  'ID do recebedor Pagar.me (rp_...) para split de pagamento do restaurante';

comment on column public.payments.provider_payload is
  'Dados extras do gateway (ex.: QR Code PIX, URL de checkout)';

-- Habilita PIX online nos restaurantes ativos
update public.restaurant_settings
set payment_methods = payment_methods || 'online'::public.payment_method
where not 'online'::public.payment_method = any (payment_methods);


-- ─── 0023_delivery_tracking_realtime.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0023 · Realtime para posições GPS do entregador (mapa do cliente)
-- =====================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'delivery_tracking'
  ) then
    alter publication supabase_realtime add table public.delivery_tracking;
  end if;
end $$;


-- ─── 0024_guest_orders.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0024 · Pedidos como convidado (token de acesso para rastreamento)
-- =====================================================================

alter table public.orders
  add column if not exists guest_access_token uuid default gen_random_uuid();

create index if not exists idx_orders_guest_token
  on public.orders (guest_access_token)
  where guest_access_token is not null;


-- ─── 0025_driver_available_orders.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0025 · RLS: entregadores aprovados e online podem ver a fila de
-- pedidos prontos ainda não atribuídos (pool de corridas disponíveis).
-- Sem isso, `orders_select` (0008) nunca libera essas linhas para o
-- motorista, pois driver_id ainda é null.
-- =====================================================================

drop policy if exists "orders_select_available_pool" on public.orders;
create policy "orders_select_available_pool" on public.orders
  for select using (
    status = 'ready'
    and type = 'delivery'
    and driver_id is null
    and exists (
      select 1 from public.drivers d
      where d.profile_id = auth.uid()
        and d.approval_status = 'approved'
        and d.status = 'available'
    )
  );


-- ─── 0026_order_prep_time.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0026 · Tempo de preparo estimado por pedido
-- Guardamos só a duração (minutos); o horário previsto é sempre
-- derivado de confirmed_at (ou created_at, antes da confirmação) +
-- prep_minutes, calculado na UI — evita duas fontes de verdade.
-- =====================================================================

alter table public.orders
  add column if not exists prep_minutes integer not null default 40 check (prep_minutes >= 0);


-- ─── 0027_guest_customers.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0027 · Clientes convidados "lembrados pelo navegador"
-- Permite que um pedido de convidado (sem login) vire um registro
-- reaproveitável em `customers`, identificado por um token opaco
-- guardado num cookie do navegador (não por telefone/CPF público —
-- evita que alguém descubra dados de outra pessoa só sabendo o
-- telefone dela). Acesso sempre via service_role (bypassa RLS),
-- igual ao padrão já usado para pedidos de convidado.
-- =====================================================================

alter table public.customers
  alter column profile_id drop not null,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists guest_token uuid unique default gen_random_uuid();


-- ─── 0028_fix_order_status_history_trigger.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0028 · Corrige a trigger de histórico de status do pedido
-- record_order_status_change() (0015) rodava com o privilégio de quem
-- chama a atualização (o dono do restaurante), mas order_status_history
-- só tem política de SELECT — nunca teve política de INSERT. Toda troca
-- de status no KDS falhava com "new row violates row-level security
-- policy for table order_status_history". Marcando a função como
-- SECURITY DEFINER (mesmo padrão das outras funções de sistema em 0007),
-- ela grava o histórico com privilégio de sistema, independente de quem
-- disparou a mudança.
-- =====================================================================

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status then
    insert into public.order_status_history (order_id, status, changed_by, created_at)
    values (new.id, new.status, auth.uid(), now());
  end if;
  return new;
end;
$$;


-- ─── 0029_fix_driver_available_orders_items.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0029 · RLS: itens do pedido também precisam ser visíveis na fila de
-- corridas disponíveis do motoboy — não só o pedido em si (0025).
-- order_items_select (0008) só libera itens de pedidos já atribuídos
-- ao motorista (driver_id = current_driver_id()), então getAvailableOrders()
-- (que faz embed de order_items pra contar itens) nunca retornava nada
-- pra um motorista olhando pedidos ainda sem dono.
-- =====================================================================

drop policy if exists "order_items_select_available_pool" on public.order_items;
create policy "order_items_select_available_pool" on public.order_items
  for select using (
    order_id in (
      select id from public.orders o
      where o.status = 'ready'
        and o.type = 'delivery'
        and o.driver_id is null
        and exists (
          select 1 from public.drivers d
          where d.profile_id = auth.uid()
            and d.approval_status = 'approved'
            and d.status = 'available'
        )
    )
  );


-- ─── 0030_fix_driver_claim_order.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0030 · RLS: motorista consegue reivindicar (aceitar) um pedido da
-- fila de disponíveis. orders_update (0008) só libera update quando
-- driver_id JÁ é do motorista — mas ao aceitar, driver_id ainda está
-- null, então a única forma de setá-lo pela primeira vez sempre falhava
-- com "Pedido não disponível mais." mesmo com o pedido livre.
-- =====================================================================

drop policy if exists "orders_update_claim_available" on public.orders;
create policy "orders_update_claim_available" on public.orders
  for update
  using (
    status = 'ready'
    and type = 'delivery'
    and driver_id is null
    and exists (
      select 1 from public.drivers d
      where d.profile_id = auth.uid()
        and d.approval_status = 'approved'
        and d.status = 'available'
    )
  )
  with check (
    driver_id in (select id from public.drivers where profile_id = auth.uid())
  );


-- ─── 0031_fix_delivery_codes_insert.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0031 · RLS: delivery_codes nunca teve política de INSERT (0018 só
-- criou a de SELECT). ensureDeliveryCode() falhava em silêncio tanto
-- ao aceitar a corrida (driver) quanto ao marcar saiu-pra-entrega
-- (restaurante) — o pedido avançava, mas o PIN de confirmação nunca
-- era gerado.
-- =====================================================================

drop policy if exists "dcodes_insert" on public.delivery_codes;
create policy "dcodes_insert" on public.delivery_codes
  for insert
  with check (
    order_id in (
      select id from public.orders
      where restaurant_id = public.current_restaurant_id()
         or driver_id = public.current_driver_id()
         or public.is_master_admin()
    )
  );


-- ─── 0032_restaurant_theme_colors.sql ─────────────────────────────────────────────────────────

-- =====================================================================
-- 0032 · Cor de marca por restaurante
-- Permite cada restaurante ter sua própria identidade visual (ex.:
-- verde/dourado pro Luciani's, preto/laranja pro Point da Pizza) sem
-- afetar a cor padrão da plataforma (laranja Nenos Food) em nenhum
-- outro lugar. Nulo = usa o laranja padrão.
-- =====================================================================

alter table public.restaurants
  add column if not exists theme_primary text,
  add column if not exists theme_secondary text;

update public.restaurants set theme_primary = '#1B4332', theme_secondary = '#C9A227'
  where slug = 'lucianis-di-qualita';

update public.restaurants set theme_primary = '#EA580C', theme_secondary = '#171717'
  where slug = 'poit-da-pizza';


-- ─── seed.sql ───────────────────────────────────────────────────────────

-- =====================================================================
-- SEED · Luciani's Di Qualità — Lasanhas & Risotos
-- Restaurante inicial + cardápio. (Execução idempotente por slug.)
-- Obs.: usuários/contas são criados via Supabase Auth (signup) e o
-- profile é provisionado pelo trigger handle_new_user.
-- =====================================================================

do $$
declare
  v_restaurant_id uuid;
  v_cat_lasanhas  uuid;
  v_cat_risotos   uuid;
  v_cat_parmegianas uuid;
  v_cat_massas    uuid;
  v_cat_entradas  uuid;
  v_cat_sobremesas uuid;
  v_cat_bebidas   uuid;
begin
  -- ─── Restaurante ───────────────────────────────────────────────────
  insert into public.restaurants (name, slug, description, cuisine, status, phone)
  values (
    'Luciani''s Di Qualità',
    'lucianis-di-qualita',
    'Lasanhas & Risotos artesanais. Autêntica culinária italiana feita com ingredientes selecionados.',
    'Italiana',
    'active',
    '(11) 90000-0000'
  )
  on conflict (slug) do update set name = excluded.name
  returning id into v_restaurant_id;

  if v_restaurant_id is null then
    select id into v_restaurant_id from public.restaurants where slug = 'lucianis-di-qualita';
  end if;

  -- ─── Configurações ─────────────────────────────────────────────────
  insert into public.restaurant_settings (
    restaurant_id, is_open, delivery_fee_cents, free_delivery_above_cents,
    min_order_cents, avg_prep_minutes, opening_hours, payment_methods,
    address_city, address_state
  )
  values (
    v_restaurant_id, true, 899, 12000, 3000, 45,
    '{"1":{"open":"18:00","close":"23:00","enabled":true},
      "2":{"open":"18:00","close":"23:00","enabled":true},
      "3":{"open":"18:00","close":"23:00","enabled":true},
      "4":{"open":"18:00","close":"23:00","enabled":true},
      "5":{"open":"18:00","close":"23:30","enabled":true},
      "6":{"open":"12:00","close":"23:30","enabled":true},
      "0":{"open":"12:00","close":"22:00","enabled":true}}'::jsonb,
    array['pix','cash','card']::public.payment_method[],
    'São Paulo', 'SP'
  )
  on conflict (restaurant_id) do nothing;

  -- ─── Categorias ────────────────────────────────────────────────────
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Lasanhas', 'lasanhas', 1)        returning id into v_cat_lasanhas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Risotos', 'risotos', 2)          returning id into v_cat_risotos;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Parmegianas', 'parmegianas', 3)  returning id into v_cat_parmegianas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Massas', 'massas', 4)            returning id into v_cat_massas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Entradas', 'entradas', 5)        returning id into v_cat_entradas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Sobremesas', 'sobremesas', 6)    returning id into v_cat_sobremesas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Bebidas', 'bebidas', 7)          returning id into v_cat_bebidas;

  -- ─── Produtos ──────────────────────────────────────────────────────
  insert into public.products
    (restaurant_id, category_id, name, slug, description, price_cents, promo_price_cents, is_featured, is_available)
  values
    -- Lasanhas
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha à Bolonhesa', 'lasanha-bolonhesa',
     'Camadas de massa fresca, molho bolonhesa artesanal e queijo gratinado.', 4990, 4490, true, true),
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha de Frango Cremoso', 'lasanha-frango-cremoso',
     'Frango desfiado ao molho branco com requeijão e mussarela.', 4790, null, true, true),
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha 4 Queijos', 'lasanha-4-queijos',
     'Mussarela, provolone, gorgonzola e parmesão em molho cremoso.', 5290, null, false, true),
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha de Camarão', 'lasanha-camarao',
     'Camarões selecionados ao molho rosé com toque de manjericão.', 6990, null, true, true),
    -- Risotos
    (v_restaurant_id, v_cat_risotos, 'Risoto de Camarão', 'risoto-camarao',
     'Arroz arbóreo cremoso com camarões e finalização de limão siciliano.', 6490, null, true, true),
    (v_restaurant_id, v_cat_risotos, 'Risoto de Tilápia', 'risoto-tilapia',
     'Tilápia grelhada com risoto ao vinho branco e ervas.', 5490, null, false, true),
    (v_restaurant_id, v_cat_risotos, 'Risoto de Funghi', 'risoto-funghi',
     'Mix de cogumelos, parmesão e azeite trufado.', 5790, 5290, true, true),
    -- Parmegianas
    (v_restaurant_id, v_cat_parmegianas, 'Parmegiana de Frango', 'parmegiana-frango',
     'Filé de frango empanado, molho de tomate e mussarela gratinada. Acompanha arroz.', 4690, null, false, true),
    (v_restaurant_id, v_cat_parmegianas, 'Parmegiana de Carne', 'parmegiana-carne',
     'Filé de carne empanado ao molho e queijo. Acompanha arroz.', 5290, null, false, true),
    (v_restaurant_id, v_cat_parmegianas, 'Parmegiana de Filé Mignon', 'parmegiana-file-mignon',
     'Medalhões de filé mignon empanados, molho rústico e mussarela.', 6990, null, true, true),
    -- Massas
    (v_restaurant_id, v_cat_massas, 'Espaguete ao Sugo', 'espaguete-sugo',
     'Espaguete artesanal ao molho de tomate fresco e manjericão.', 3890, null, false, true),
    (v_restaurant_id, v_cat_massas, 'Talharim ao Funghi', 'talharim-funghi',
     'Talharim com molho cremoso de cogumelos.', 4690, null, false, true),
    (v_restaurant_id, v_cat_massas, 'Nhoque ao Pomodoro', 'nhoque-pomodoro',
     'Nhoque de batata ao molho pomodoro e parmesão.', 4290, null, false, true),
    (v_restaurant_id, v_cat_massas, 'Ravioli de Queijo', 'ravioli-queijo',
     'Ravioli recheado com queijos ao molho de manteiga e sálvia.', 4990, null, false, true),
    -- Entradas
    (v_restaurant_id, v_cat_entradas, 'Bruschetta Clássica', 'bruschetta-classica',
     'Pão italiano, tomate, manjericão e azeite extravirgem.', 2490, null, false, true),
    (v_restaurant_id, v_cat_entradas, 'Tábua de Frios', 'tabua-de-frios',
     'Seleção de queijos e embutidos italianos.', 4490, null, false, true),
    -- Sobremesas
    (v_restaurant_id, v_cat_sobremesas, 'Tiramisù', 'tiramisu',
     'Clássico italiano com café, mascarpone e cacau.', 2690, null, true, true),
    (v_restaurant_id, v_cat_sobremesas, 'Petit Gâteau', 'petit-gateau',
     'Bolo quente de chocolate com sorvete de creme.', 2890, null, false, true),
    -- Bebidas
    (v_restaurant_id, v_cat_bebidas, 'Água Mineral 500ml', 'agua-mineral',
     'Sem gás.', 590, null, false, true),
    (v_restaurant_id, v_cat_bebidas, 'Refrigerante Lata', 'refrigerante-lata',
     'Coca-Cola, Guaraná ou Soda.', 790, null, false, true),
    (v_restaurant_id, v_cat_bebidas, 'Suco Natural 300ml', 'suco-natural',
     'Laranja, limão ou maracujá.', 1190, null, false, true)
  on conflict (restaurant_id, slug) do nothing;

  -- ─── Cupom de boas-vindas ──────────────────────────────────────────
  insert into public.coupons
    (restaurant_id, code, type, value_percent, min_order_cents, is_active)
  values
    (v_restaurant_id, 'BEMVINDO10', 'percentage', 10, 4000, true)
  on conflict (restaurant_id, code) do nothing;

end;
$$;
