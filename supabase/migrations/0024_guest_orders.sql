-- =====================================================================
-- 0024 · Pedidos como convidado (token de acesso para rastreamento)
-- =====================================================================

alter table public.orders
  add column if not exists guest_access_token uuid default gen_random_uuid();

create index if not exists idx_orders_guest_token
  on public.orders (guest_access_token)
  where guest_access_token is not null;
