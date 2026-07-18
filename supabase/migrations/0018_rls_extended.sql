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
