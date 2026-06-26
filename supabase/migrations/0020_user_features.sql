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
