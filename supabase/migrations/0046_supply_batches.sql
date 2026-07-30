-- =====================================================================
-- 0046 · Fechamento de lote de insumos: quando o master_admin paga o
--        restaurante pelos itens aprovados, "fecha o lote" (marca todos
--        os aprovados-e-ainda-não-pagos como pagos de uma vez). Os
--        lançamentos novos automaticamente ficam no próximo lote (em
--        aberto), sem precisar de uma tabela de lote separada — o lote
--        é só "tudo que tem o mesmo paid_at".
-- =====================================================================

alter table public.supply_entries
  add column paid_at timestamptz,
  add column paid_by uuid references public.profiles (id) on delete set null;

comment on column public.supply_entries.paid_at is
  'Quando o lote foi fechado (pago). Nulo = ainda no lote aberto atual.';

-- Bypassa a RLS de propósito (a policy de update trava qualquer mudança
-- em lançamento já aprovado) — só o master_admin, e só pra marcar como
-- pago, nunca pra alterar quantidade/preço/status.
create or replace function public.close_supply_batch(p_restaurant_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_master_admin() then
    raise exception 'Sem permissão.';
  end if;

  update public.supply_entries
    set paid_at = now(), paid_by = auth.uid()
    where restaurant_id = p_restaurant_id
      and status = 'approved'
      and paid_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.close_supply_batch(uuid) to authenticated;
