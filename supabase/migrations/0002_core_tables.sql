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
