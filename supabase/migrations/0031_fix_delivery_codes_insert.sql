-- =====================================================================
-- 0031 · RLS: delivery_codes nunca teve política de INSERT (0018 só
-- criou a de SELECT). ensureDeliveryCode() falhava em silêncio tanto
-- ao aceitar a corrida (driver) quanto ao marcar saiu-pra-entrega
-- (restaurante) — o pedido avançava, mas o PIN de confirmação nunca
-- era gerado.
-- =====================================================================

drop policy if exists "dcodes_insert" on public.delivery_codes;
create policy "dcodes_insert" on public.delivery_codes
  for insert
  with check (
    order_id in (
      select id from public.orders
      where restaurant_id = public.current_restaurant_id()
         or driver_id = public.current_driver_id()
         or public.is_master_admin()
    )
  );
