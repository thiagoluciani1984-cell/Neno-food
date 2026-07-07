-- ⚠️ DEPRECADO — use supabase/migrations/0016_catalog_extended.sql
-- Mantido apenas para referência. Prefira: npm run db:apply
--
-- Sprint 1: tabelas de opções de produto (migration 0016 resumida)
-- Rode apenas se product_options ainda não existir.

do $$ begin
  create type public.option_type as enum ('single', 'multiple');
exception when duplicate_object then null; end $$;

create table if not exists public.product_options (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  name        text not null,
  type        public.option_type not null default 'single',
  is_required boolean not null default false,
  min_qty     smallint not null default 0 check (min_qty >= 0),
  max_qty     smallint not null default 1 check (max_qty >= 1),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (min_qty <= max_qty)
);

create table if not exists public.product_option_items (
  id            uuid primary key default gen_random_uuid(),
  option_id     uuid not null references public.product_options (id) on delete cascade,
  name          text not null,
  price_cents   integer not null default 0 check (price_cents >= 0),
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.order_item_options (
  id                   uuid primary key default gen_random_uuid(),
  order_item_id        uuid not null references public.order_items (id) on delete cascade,
  option_id            uuid references public.product_options (id) on delete set null,
  option_item_id       uuid references public.product_option_items (id) on delete set null,
  option_name          text not null,
  option_item_name     text not null,
  unit_price_cents     integer not null default 0 check (unit_price_cents >= 0),
  quantity             smallint not null default 1 check (quantity > 0),
  created_at           timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_options_updated_at on public.product_options;
create trigger trg_product_options_updated_at
  before update on public.product_options
  for each row execute function public.set_updated_at();

drop trigger if exists trg_product_option_items_updated_at on public.product_option_items;
create trigger trg_product_option_items_updated_at
  before update on public.product_option_items
  for each row execute function public.set_updated_at();
