-- =====================================================================
-- 0048 · Fila de impressão de lote de insumos: o painel web não pode
--        acionar o agente local diretamente (roda na Vercel, o agente
--        roda no PC do restaurante) — em vez disso grava um pedido
--        aqui, e o agente (que já fica de pé monitorando pedidos)
--        confere essa fila periodicamente e imprime sozinho.
-- =====================================================================

create type public.supply_print_request_status as enum ('pending', 'printed', 'failed');

create table public.supply_print_requests (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  batch_key      text not null,
  status         public.supply_print_request_status not null default 'pending',
  requested_by   uuid references public.profiles (id) on delete set null,
  error          text,
  requested_at   timestamptz not null default now(),
  printed_at     timestamptz
);

create index idx_supply_print_requests_restaurant_status
  on public.supply_print_requests (restaurant_id, status);

alter table public.supply_print_requests enable row level security;

-- Mesmo padrão de supply_entries: dono/staff do restaurante ou master_admin
-- pedem impressão; o agente local (logado com a conta do próprio
-- restaurante) confere e marca como impresso/falhou.
create policy "supply_print_requests_select" on public.supply_print_requests
  for select
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "supply_print_requests_insert" on public.supply_print_requests
  for insert
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "supply_print_requests_update" on public.supply_print_requests
  for update
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());
