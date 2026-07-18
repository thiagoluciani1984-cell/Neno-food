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
drop policy if exists "public_read_product_images" on storage.objects;
create policy "public_read_product_images" on storage.objects
  for select using (bucket_id in ('product-images', 'restaurant-assets'));

-- Upload/edição/remoção apenas por usuários autenticados de restaurante/master.
-- (validação fina do tenant é feita na camada de aplicação via path = restaurant_id/...)
drop policy if exists "staff_write_product_images" on storage.objects;
create policy "staff_write_product_images" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'restaurant-assets'));

drop policy if exists "staff_update_product_images" on storage.objects;
create policy "staff_update_product_images" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'restaurant-assets'));

drop policy if exists "staff_delete_product_images" on storage.objects;
create policy "staff_delete_product_images" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'restaurant-assets'));
