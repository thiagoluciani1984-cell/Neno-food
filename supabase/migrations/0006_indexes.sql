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
