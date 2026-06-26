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
create trigger trg_product_options_updated_at
  before update on public.product_options
  for each row execute function public.set_updated_at();

create trigger trg_product_option_items_updated_at
  before update on public.product_option_items
  for each row execute function public.set_updated_at();
