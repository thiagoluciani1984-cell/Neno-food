-- =====================================================================
-- 0050 · Fila de reimpressão de comanda: o agente local já imprime todo
--        pedido novo sozinho (checkNewOrders), mas se a comanda não sair
--        (impressora sem papel, agente reiniciando etc.) não existia como
--        pedir uma reimpressão de outro dispositivo. Mesmo padrão da fila
--        de lote de insumos (0048) — o painel grava aqui, o agente (que já
--        fica de pé monitorando) confere e imprime sozinho.
-- =====================================================================

create type public.order_print_request_status as enum ('pending', 'printed', 'failed');

create table public.order_print_requests (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  order_id       uuid not null references public.orders (id) on delete cascade,
  status         public.order_print_request_status not null default 'pending',
  requested_by   uuid references public.profiles (id) on delete set null,
  error          text,
  requested_at   timestamptz not null default now(),
  printed_at     timestamptz
);

create index idx_order_print_requests_restaurant_status
  on public.order_print_requests (restaurant_id, status);

alter table public.order_print_requests enable row level security;

create policy "order_print_requests_select" on public.order_print_requests
  for select
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "order_print_requests_insert" on public.order_print_requests
  for insert
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "order_print_requests_update" on public.order_print_requests
  for update
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());
