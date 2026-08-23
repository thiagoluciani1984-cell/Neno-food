-- =====================================================================
-- 0049 · Restaurante parceiro de troca de insumos: dois restaurantes
--        (ex: Lucianis e Point da Pizza) pegam insumos um do outro.
--        Quem LANÇA é quem forneceu (o lote/relatório fica com ele);
--        quem APROVA é sempre o restaurante PARCEIRO, confirmando o que
--        recebeu. master_admin continua podendo aprovar qualquer coisa,
--        como reforço.
-- =====================================================================

alter table public.restaurants
  add column partner_restaurant_id uuid references public.restaurants (id) on delete set null,
  add constraint restaurants_partner_not_self check (partner_restaurant_id is distinct from id);

comment on column public.restaurants.partner_restaurant_id is
  'Restaurante com quem este troca insumos (ex: Lucianis <-> Point da Pizza). Quem lança fica com o lote; o parceiro aprova.';

create or replace function public.current_restaurant_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select r.partner_restaurant_id
  from public.restaurants r
  where r.id = public.current_restaurant_id();
$$;

-- SELECT: o parceiro passa a enxergar os lançamentos do outro lado (pra
-- acompanhar o que está pegando/fornecendo), além do próprio e do admin.
drop policy if exists "supply_entries_select" on public.supply_entries;
create policy "supply_entries_select" on public.supply_entries
  for select
  using (
    restaurant_id = public.current_restaurant_id()
    or restaurant_id = public.current_restaurant_partner_id()
    or public.is_master_admin()
  );

-- UPDATE: o parceiro precisa alcançar a linha pra poder aprovar/rejeitar.
-- A trigger de campos (abaixo) garante que ele só mexe no status, nunca
-- em item/quantidade/preço.
drop policy if exists "supply_entries_update" on public.supply_entries;
create policy "supply_entries_update" on public.supply_entries
  for update
  using (
    (
      restaurant_id = public.current_restaurant_id()
      or restaurant_id = public.current_restaurant_partner_id()
      or public.is_master_admin()
    )
    and status <> 'approved'
  )
  with check (
    restaurant_id = public.current_restaurant_id()
    or restaurant_id = public.current_restaurant_partner_id()
    or public.is_master_admin()
  );

-- Defesa em profundidade: o restaurante parceiro só pode alterar o
-- status (via aprovação/rejeição) — item, quantidade, preço, data e
-- observação continuam travados pra quem não é dono do lançamento.
create or replace function public.protect_supply_entry_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    old.restaurant_id = public.current_restaurant_id()
    or public.is_master_admin()
  ) then
    new.item_id := old.item_id;
    new.item_name := old.item_name;
    new.unit_type := old.unit_type;
    new.quantity := old.quantity;
    new.unit_price_cents := old.unit_price_cents;
    new.total_cents := old.total_cents;
    new.taken_at := old.taken_at;
    new.notes := old.notes;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_supply_entry_fields on public.supply_entries;
create trigger trg_protect_supply_entry_fields
  before update on public.supply_entries
  for each row execute function public.protect_supply_entry_fields();

-- Aprovação: além de "mesmo restaurante, outro autor" (peer approval pra
-- quando houver mais de uma pessoa no mesmo restaurante), agora o
-- restaurante PARCEIRO também pode aprovar/rejeitar.
create or replace function public.protect_supply_entry_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status then
    if not (
      public.is_master_admin()
      or (
        old.restaurant_id = public.current_restaurant_id()
        and old.created_by is distinct from auth.uid()
      )
      or old.restaurant_id = public.current_restaurant_partner_id()
    ) then
      new.status := old.status;
      new.approved_by := old.approved_by;
      new.approved_at := old.approved_at;
    end if;
  end if;
  return new;
end;
$$;
