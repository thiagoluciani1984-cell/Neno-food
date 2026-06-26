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
