-- =====================================================================
-- 0001 · Extensões e tipos enumerados
-- Di Qualità Food — base do schema multi-tenant
-- =====================================================================

create extension if not exists "pgcrypto";        -- gen_random_uuid()
create extension if not exists "citext";           -- e-mails case-insensitive
create extension if not exists "pg_trgm";          -- busca textual em produtos

-- ─── Enums de domínio ────────────────────────────────────────────────

create type public.user_role as enum (
  'master_admin',
  'restaurant',
  'customer',
  'driver'
);

create type public.restaurant_status as enum (
  'pending',   -- aguardando aprovação do master admin
  'active',
  'blocked'
);

create type public.order_type as enum (
  'delivery',
  'pickup',    -- retirada no balcão
  'dine_in'    -- consumo local
);

create type public.order_status as enum (
  'received',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

create type public.payment_method as enum (
  'pix',
  'cash',
  'card',
  'online'
);

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded'
);

create type public.coupon_type as enum (
  'percentage',
  'fixed',
  'free_shipping'
);

create type public.driver_status as enum (
  'offline',
  'available',
  'busy'
);

create type public.notification_type as enum (
  'order_update',
  'promotion',
  'system'
);


-- =====================================================================
-- 0002 · Tabelas core: roles, profiles, restaurants, restaurant_settings
-- =====================================================================

-- ─── roles (catálogo de papéis / metadados de permissão) ─────────────
create table public.roles (
  key         public.user_role primary key,
  label       text not null,
  description text
);

insert into public.roles (key, label, description) values
  ('master_admin', 'Master Admin', 'Gerencia toda a plataforma'),
  ('restaurant',   'Restaurante',  'Gerencia seu próprio estabelecimento'),
  ('customer',     'Cliente',      'Faz pedidos e acompanha entregas'),
  ('driver',       'Entregador',   'Realiza entregas');

-- ─── profiles (espelha auth.users) ───────────────────────────────────
-- restaurant_id: para usuários do tipo 'restaurant'/'driver', indica a
-- qual estabelecimento pertencem (base do isolamento multi-tenant).
create table public.profiles (
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
create table public.restaurants (
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
alter table public.profiles
  add constraint profiles_restaurant_id_fkey
  foreign key (restaurant_id) references public.restaurants (id) on delete set null;

-- ─── restaurant_settings (1:1 com restaurants) ───────────────────────
create table public.restaurant_settings (
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


-- =====================================================================
-- 0003 · Catálogo: categories, products, product_images
-- =====================================================================

create table public.categories (
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

create table public.products (
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
create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);


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


-- =====================================================================
-- 0006 · Índices para performance (multi-tenant filtra sempre por
--        restaurant_id; orders por status/data; busca textual)
-- =====================================================================

-- profiles
create index idx_profiles_role on public.profiles (role);
create index idx_profiles_restaurant on public.profiles (restaurant_id);

-- restaurants
create index idx_restaurants_status on public.restaurants (status);

-- catálogo
create index idx_categories_restaurant on public.categories (restaurant_id);
create index idx_categories_active on public.categories (restaurant_id, is_active) where deleted_at is null;

create index idx_products_restaurant on public.products (restaurant_id);
create index idx_products_category on public.products (category_id);
create index idx_products_available on public.products (restaurant_id, is_available) where deleted_at is null;
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);

-- clientes / delivery
create index idx_addresses_customer on public.addresses (customer_id);
create index idx_drivers_restaurant on public.drivers (restaurant_id);
create index idx_drivers_status on public.drivers (status);

-- pedidos (consultas mais quentes do KDS e relatórios)
create index idx_orders_restaurant on public.orders (restaurant_id);
create index idx_orders_status on public.orders (restaurant_id, status);
create index idx_orders_customer on public.orders (customer_id);
create index idx_orders_driver on public.orders (driver_id);
create index idx_orders_created on public.orders (restaurant_id, created_at desc);

create index idx_order_items_order on public.order_items (order_id);
create index idx_order_items_product on public.order_items (product_id);

-- pagamentos / cupons
create index idx_payments_order on public.payments (order_id);
create index idx_coupons_restaurant on public.coupons (restaurant_id);
create index idx_coupon_usage_coupon on public.coupon_usage (coupon_id);

-- notificações
create index idx_notifications_user on public.notifications (user_id, read_at);

-- avaliações
create index idx_reviews_restaurant on public.reviews (restaurant_id);


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
create policy "roles_read_all" on public.roles
  for select using (true);

-- ─── profiles ────────────────────────────────────────────────────────
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_master_admin()
    or (restaurant_id is not null and restaurant_id = public.current_restaurant_id())
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_master_admin())
  with check (id = auth.uid() or public.is_master_admin());

create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_master_admin());

-- ─── restaurants ─────────────────────────────────────────────────────
create policy "restaurants_select" on public.restaurants
  for select using (
    status = 'active'
    or owner_id = auth.uid()
    or id = public.current_restaurant_id()
    or public.is_master_admin()
  );

create policy "restaurants_insert" on public.restaurants
  for insert with check (owner_id = auth.uid() or public.is_master_admin());

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
create policy "settings_select" on public.restaurant_settings
  for select using (
    restaurant_id in (select id from public.restaurants where status = 'active')
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

create policy "settings_write" on public.restaurant_settings
  for all using (
    restaurant_id = public.current_restaurant_id() or public.is_master_admin()
  )
  with check (
    restaurant_id = public.current_restaurant_id() or public.is_master_admin()
  );

-- ─── helper macro de leitura pública de restaurante ativo ────────────
-- (categorias/produtos públicos quando o restaurante está ativo)

create policy "categories_public_read" on public.categories
  for select using (
    (deleted_at is null
      and restaurant_id in (select id from public.restaurants where status = 'active'))
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

create policy "categories_write" on public.categories
  for all using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "products_public_read" on public.products
  for select using (
    (deleted_at is null
      and restaurant_id in (select id from public.restaurants where status = 'active'))
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

create policy "products_write" on public.products
  for all using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "product_images_read" on public.product_images
  for select using (
    product_id in (select id from public.products) -- visibilidade herda de products via RLS
  );

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
create policy "customers_select_own" on public.customers
  for select using (profile_id = auth.uid() or public.is_master_admin());

create policy "customers_update_own" on public.customers
  for update using (profile_id = auth.uid() or public.is_master_admin())
  with check (profile_id = auth.uid() or public.is_master_admin());

-- ─── addresses ───────────────────────────────────────────────────────
create policy "addresses_own" on public.addresses
  for all using (customer_id = public.current_customer_id() or public.is_master_admin())
  with check (customer_id = public.current_customer_id() or public.is_master_admin());

-- ─── drivers ─────────────────────────────────────────────────────────
create policy "drivers_select" on public.drivers
  for select using (
    profile_id = auth.uid()
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

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
create policy "favorites_own" on public.favorites
  for all using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

-- ─── reviews ─────────────────────────────────────────────────────────
create policy "reviews_public_read" on public.reviews
  for select using (true);

create policy "reviews_insert_own" on public.reviews
  for insert with check (customer_id = public.current_customer_id());

create policy "reviews_modify_own" on public.reviews
  for update using (customer_id = public.current_customer_id() or public.is_master_admin())
  with check (customer_id = public.current_customer_id() or public.is_master_admin());

create policy "reviews_delete_own" on public.reviews
  for delete using (customer_id = public.current_customer_id() or public.is_master_admin());

-- ─── coupons (apenas staff/master; validação pública via server action) ─
create policy "coupons_staff" on public.coupons
  for all using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

-- ─── orders ──────────────────────────────────────────────────────────
create policy "orders_select" on public.orders
  for select using (
    customer_id = public.current_customer_id()
    or restaurant_id = public.current_restaurant_id()
    or driver_id = public.current_driver_id()
    or public.is_master_admin()
  );

create policy "orders_insert" on public.orders
  for insert with check (
    customer_id = public.current_customer_id()
    or restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  );

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
create policy "notifications_own" on public.notifications
  for select using (user_id = auth.uid() or public.is_master_admin());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());


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
create policy "public_read_product_images" on storage.objects
  for select using (bucket_id in ('product-images', 'restaurant-assets'));

-- Upload/edição/remoção apenas por usuários autenticados de restaurante/master.
-- (validação fina do tenant é feita na camada de aplicação via path = restaurant_id/...)
create policy "staff_write_product_images" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'restaurant-assets'));

create policy "staff_update_product_images" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'restaurant-assets'));

create policy "staff_delete_product_images" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'restaurant-assets'));


-- =====================================================================
-- 0010 · Habilita Realtime (Postgres changes) nas tabelas necessárias
-- =====================================================================

-- KDS (cozinha) e tracking do cliente dependem de mudanças em orders.
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.notifications;


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


