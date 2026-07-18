-- =====================================================================
-- 0028 · Corrige a trigger de histórico de status do pedido
-- record_order_status_change() (0015) rodava com o privilégio de quem
-- chama a atualização (o dono do restaurante), mas order_status_history
-- só tem política de SELECT — nunca teve política de INSERT. Toda troca
-- de status no KDS falhava com "new row violates row-level security
-- policy for table order_status_history". Marcando a função como
-- SECURITY DEFINER (mesmo padrão das outras funções de sistema em 0007),
-- ela grava o histórico com privilégio de sistema, independente de quem
-- disparou a mudança.
-- =====================================================================

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status then
    insert into public.order_status_history (order_id, status, changed_by, created_at)
    values (new.id, new.status, auth.uid(), now());
  end if;
  return new;
end;
$$;
