-- =====================================================================
-- 0044 · Ledger de insumos: catálogo de itens + lançamentos com
--        aprovação obrigatória do master_admin antes de contar no
--        relatório. Ex.: Thiago pega queijo/presunto/farinha na Point
--        da Pizza, Jadson lança no sistema, Thiago aprova.
-- =====================================================================

create type public.supply_unit_type as enum ('kg', 'unit');
create type public.supply_entry_status as enum ('pending', 'approved', 'rejected');

create table public.supply_items (
  id                   uuid primary key default gen_random_uuid(),
  restaurant_id        uuid not null references public.restaurants (id) on delete cascade,
  name                 text not null,
  unit_type            public.supply_unit_type not null,
  default_price_cents  integer not null check (default_price_cents >= 0),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_supply_items_restaurant on public.supply_items (restaurant_id);

-- guarda SNAPSHOT de nome/tipo (histórico imutável, igual order_items)
create table public.supply_entries (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants (id) on delete cascade,
  item_id           uuid references public.supply_items (id) on delete set null,
  item_name         text not null,
  unit_type         public.supply_unit_type not null,
  quantity          numeric(10,3) not null check (quantity > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  total_cents       integer not null check (total_cents >= 0),
  taken_at          date not null default current_date,
  notes             text,
  status            public.supply_entry_status not null default 'pending',
  created_by        uuid references public.profiles (id) on delete set null,
  approved_by       uuid references public.profiles (id) on delete set null,
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_supply_entries_restaurant on public.supply_entries (restaurant_id);
create index idx_supply_entries_status on public.supply_entries (status);

alter table public.supply_items enable row level security;
alter table public.supply_entries enable row level security;

-- Catálogo: dono do restaurante ou master_admin cadastram/editam livremente.
create policy "supply_items_all" on public.supply_items
  for all
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

-- Lançamentos: select/insert liberado pro dono/staff do restaurante ou
-- master_admin. Update/delete só enquanto 'pending' — uma vez aprovado,
-- a linha sai do escopo do "using" pra QUALQUER UPDATE/DELETE (nem
-- master_admin edita depois), garantindo o histórico travado no banco.
create policy "supply_entries_select" on public.supply_entries
  for select
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "supply_entries_insert" on public.supply_entries
  for insert
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "supply_entries_update" on public.supply_entries
  for update
  using (
    (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
    and status <> 'approved'
  )
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "supply_entries_delete" on public.supply_entries
  for delete
  using (
    (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
    and status <> 'approved'
  );

-- Defesa em profundidade: só master_admin pode de fato mudar o status
-- (aprovar/rejeitar), mesmo que o dono do restaurante tente um update
-- direto na API do Supabase fora da nossa tela.
create or replace function public.protect_supply_entry_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status and not public.is_master_admin() then
    new.status := old.status;
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
  end if;
  return new;
end;
$$;

create trigger trg_protect_supply_entry_status
  before update of status on public.supply_entries
  for each row execute function public.protect_supply_entry_status();

-- Realtime: painel do master_admin atualiza sozinho quando o dono lança.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'supply_entries'
  ) then
    alter publication supabase_realtime add table public.supply_entries;
  end if;
end $$;
