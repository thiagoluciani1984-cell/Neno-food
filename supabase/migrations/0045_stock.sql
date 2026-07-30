-- =====================================================================
-- 0045 · Módulo de Estoque: catálogo de insumos, ficha técnica e
--        movimentações (entrada/saída), com baixa automática no
--        confirmar-pedido e integração com o módulo de Insumos entre
--        restaurantes (0044) — só via CREATE TRIGGER, sem alterar
--        nenhuma tabela existente.
-- =====================================================================

create type public.stock_unit_type as enum ('g', 'kg', 'ml', 'l', 'un');
create type public.stock_movement_type as enum ('in', 'out');
create type public.stock_movement_reason as enum
  ('purchase', 'sale_deduction', 'loss', 'adjustment', 'supply_transfer');

create table public.stock_items (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants (id) on delete cascade,
  name              text not null,
  unit_type         public.stock_unit_type not null,
  min_quantity      numeric(12,3) not null default 0 check (min_quantity >= 0),
  current_quantity  numeric(12,3) not null default 0, -- só muda via trigger de stock_movements
  unit_cost_cents   integer not null default 0 check (unit_cost_cents >= 0),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (restaurant_id, name)
);

create index idx_stock_items_restaurant on public.stock_items (restaurant_id);

create table public.stock_movements (
  id                      uuid primary key default gen_random_uuid(),
  restaurant_id           uuid not null references public.restaurants (id) on delete cascade,
  stock_item_id           uuid not null references public.stock_items (id) on delete cascade,
  type                    public.stock_movement_type not null,
  reason                  public.stock_movement_reason not null,
  quantity                numeric(12,3) not null check (quantity > 0),
  unit_cost_cents         integer not null default 0 check (unit_cost_cents >= 0),
  total_cost_cents        integer not null default 0 check (total_cost_cents >= 0),
  related_order_id        uuid references public.orders (id) on delete set null,
  source_supply_entry_id  uuid references public.supply_entries (id) on delete set null,
  notes                   text,
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now()
);

create index idx_stock_movements_restaurant on public.stock_movements (restaurant_id);
create index idx_stock_movements_item on public.stock_movements (stock_item_id);

-- ficha técnica: quanto de cada insumo um produto do cardápio consome
create table public.stock_recipes (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants (id) on delete cascade,
  product_id        uuid not null references public.products (id) on delete cascade,
  stock_item_id     uuid not null references public.stock_items (id) on delete cascade,
  quantity_per_unit numeric(12,3) not null check (quantity_per_unit > 0),
  created_at        timestamptz not null default now(),
  unique (product_id, stock_item_id)
);

create index idx_stock_recipes_product on public.stock_recipes (product_id);

alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_recipes enable row level security;

create policy "stock_items_all" on public.stock_items
  for all
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "stock_movements_select" on public.stock_movements
  for select
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

create policy "stock_movements_insert" on public.stock_movements
  for insert
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

-- movimentações são histórico imutável: sem update/delete via API, nem
-- pra master_admin (corrige lançando um movimento novo de ajuste).

create policy "stock_recipes_all" on public.stock_recipes
  for all
  using (restaurant_id = public.current_restaurant_id() or public.is_master_admin())
  with check (restaurant_id = public.current_restaurant_id() or public.is_master_admin());

-- ─── Saldo sempre derivado do histórico de movimentações ──────────────
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta numeric(12,3);
begin
  v_delta := case when new.type = 'in' then new.quantity else -new.quantity end;

  update public.stock_items
    set current_quantity = current_quantity + v_delta,
        updated_at = now()
    where id = new.stock_item_id;

  return new;
end;
$$;

create trigger trg_apply_stock_movement
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- ─── Baixa automática ao confirmar pedido (escuta orders, não altera) ──
create or replace function public.stock_deduct_for_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.stock_movements
      (restaurant_id, stock_item_id, type, reason, quantity, unit_cost_cents, total_cost_cents, related_order_id)
    select
      new.restaurant_id,
      r.stock_item_id,
      'out',
      'sale_deduction',
      r.quantity_per_unit * oi.quantity,
      si.unit_cost_cents,
      round(r.quantity_per_unit * oi.quantity * si.unit_cost_cents),
      new.id
    from public.order_items oi
    join public.stock_recipes r on r.product_id = oi.product_id
    join public.stock_items si on si.id = r.stock_item_id
    where oi.order_id = new.id;
  exception when others then
    -- Baixa de estoque nunca pode impedir a confirmação de um pedido real
    -- (ficha técnica ausente/errada, insumo desativado, etc. são só avisos).
    raise warning 'stock_deduct_for_order falhou pro pedido %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

create trigger trg_stock_deduct_for_order
  after update of status on public.orders
  for each row
  when (new.status = 'confirmed' and old.status is distinct from 'confirmed')
  execute function public.stock_deduct_for_order();

-- ─── Integração com o módulo de Insumos (0044): aprovado -> entrada ────
create or replace function public.stock_entry_from_supply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_item_id uuid;
begin
  begin
    -- supply_entries.unit_type é 'kg'|'unit' (0044); stock_items.unit_type
    -- é 'g'|'kg'|'ml'|'l'|'un' (mais granular) — mapeia explicitamente em
    -- vez de confiar num cast de texto (os rótulos não são iguais).
    insert into public.stock_items (restaurant_id, name, unit_type, unit_cost_cents)
    values (
      new.restaurant_id,
      new.item_name,
      case new.unit_type::text when 'unit' then 'un' else 'kg' end::public.stock_unit_type,
      new.unit_price_cents
    )
    on conflict (restaurant_id, name) do update
      set unit_cost_cents = excluded.unit_cost_cents
    returning id into v_stock_item_id;

    if v_stock_item_id is null then
      select id into v_stock_item_id
        from public.stock_items
        where restaurant_id = new.restaurant_id and name = new.item_name;
    end if;

    insert into public.stock_movements
      (restaurant_id, stock_item_id, type, reason, quantity, unit_cost_cents, total_cost_cents, source_supply_entry_id)
    values (
      new.restaurant_id,
      v_stock_item_id,
      'in',
      'supply_transfer',
      new.quantity,
      new.unit_price_cents,
      new.total_cents,
      new.id
    );
  exception when others then
    raise warning 'stock_entry_from_supply falhou pro lançamento %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

create trigger trg_stock_entry_from_supply
  after update of status on public.supply_entries
  for each row
  when (new.status = 'approved' and old.status is distinct from 'approved')
  execute function public.stock_entry_from_supply();

-- ─── Realtime ───────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stock_items'
  ) then
    alter publication supabase_realtime add table public.stock_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stock_movements'
  ) then
    alter publication supabase_realtime add table public.stock_movements;
  end if;
end $$;
