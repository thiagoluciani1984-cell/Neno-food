-- =====================================================================
-- 0029 · RLS: itens do pedido também precisam ser visíveis na fila de
-- corridas disponíveis do motoboy — não só o pedido em si (0025).
-- order_items_select (0008) só libera itens de pedidos já atribuídos
-- ao motorista (driver_id = current_driver_id()), então getAvailableOrders()
-- (que faz embed de order_items pra contar itens) nunca retornava nada
-- pra um motorista olhando pedidos ainda sem dono.
-- =====================================================================

drop policy if exists "order_items_select_available_pool" on public.order_items;
create policy "order_items_select_available_pool" on public.order_items
  for select using (
    order_id in (
      select id from public.orders o
      where o.status = 'ready'
        and o.type = 'delivery'
        and o.driver_id is null
        and exists (
          select 1 from public.drivers d
          where d.profile_id = auth.uid()
            and d.approval_status = 'approved'
            and d.status = 'available'
        )
    )
  );
