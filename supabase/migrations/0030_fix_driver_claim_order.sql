-- =====================================================================
-- 0030 · RLS: motorista consegue reivindicar (aceitar) um pedido da
-- fila de disponíveis. orders_update (0008) só libera update quando
-- driver_id JÁ é do motorista — mas ao aceitar, driver_id ainda está
-- null, então a única forma de setá-lo pela primeira vez sempre falhava
-- com "Pedido não disponível mais." mesmo com o pedido livre.
-- =====================================================================

drop policy if exists "orders_update_claim_available" on public.orders;
create policy "orders_update_claim_available" on public.orders
  for update
  using (
    status = 'ready'
    and type = 'delivery'
    and driver_id is null
    and exists (
      select 1 from public.drivers d
      where d.profile_id = auth.uid()
        and d.approval_status = 'approved'
        and d.status = 'available'
    )
  )
  with check (
    driver_id in (select id from public.drivers where profile_id = auth.uid())
  );
