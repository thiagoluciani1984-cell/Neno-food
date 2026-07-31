-- =====================================================================
-- 0047 · Aprovação cruzada de insumos: quem lançou não pode aprovar o
--        próprio lançamento — o OUTRO lado do restaurante confirma
--        (ex: Thiago lança insumo que o Jadson viu sair, Jadson aprova;
--        Jadson lança o que o Thiago pegou, Thiago aprova). master_admin
--        continua podendo aprovar qualquer lançamento, como reforço.
-- =====================================================================

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
    ) then
      new.status := old.status;
      new.approved_by := old.approved_by;
      new.approved_at := old.approved_at;
    end if;
  end if;
  return new;
end;
$$;
