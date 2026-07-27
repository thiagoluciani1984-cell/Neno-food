-- Roleta de lançamento: desconto (10-50%) sorteado a cada um dos 5 primeiros
-- pedidos de cada cliente logado.
create table if not exists public.launch_wheel_spins (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers (id) on delete cascade,
  order_sequence    smallint not null check (order_sequence between 1 and 5),
  discount_percent  smallint not null check (discount_percent between 10 and 50),
  order_id          uuid references public.orders (id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (customer_id, order_sequence)
);

create index if not exists idx_launch_wheel_spins_customer on public.launch_wheel_spins (customer_id);

alter table public.launch_wheel_spins enable row level security;

drop policy if exists "launch_wheel_spins_select" on public.launch_wheel_spins;
create policy "launch_wheel_spins_select" on public.launch_wheel_spins
  for select using (
    customer_id = public.current_customer_id()
    or public.is_master_admin()
  );

drop policy if exists "launch_wheel_spins_insert" on public.launch_wheel_spins;
create policy "launch_wheel_spins_insert" on public.launch_wheel_spins
  for insert with check (
    customer_id = public.current_customer_id()
    or public.is_master_admin()
  );

drop policy if exists "launch_wheel_spins_update" on public.launch_wheel_spins;
create policy "launch_wheel_spins_update" on public.launch_wheel_spins
  for update using (
    customer_id = public.current_customer_id()
    or public.is_master_admin()
  );

comment on table public.launch_wheel_spins is
  'Campanha de lançamento: 1 giro sorteado por cliente por pedido, nos 5 primeiros pedidos.';
