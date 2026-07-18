-- =====================================================================
-- 0025 · RLS: entregadores aprovados e online podem ver a fila de
-- pedidos prontos ainda não atribuídos (pool de corridas disponíveis).
-- Sem isso, `orders_select` (0008) nunca libera essas linhas para o
-- motorista, pois driver_id ainda é null.
-- =====================================================================

create policy "orders_select_available_pool" on public.orders
  for select using (
    status = 'ready'
    and type = 'delivery'
    and driver_id is null
    and exists (
      select 1 from public.drivers d
      where d.profile_id = auth.uid()
        and d.approval_status = 'approved'
        and d.status = 'available'
    )
  );
