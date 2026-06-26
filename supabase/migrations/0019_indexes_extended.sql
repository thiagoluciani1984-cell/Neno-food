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
