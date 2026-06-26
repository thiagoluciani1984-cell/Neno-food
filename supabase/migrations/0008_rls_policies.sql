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
