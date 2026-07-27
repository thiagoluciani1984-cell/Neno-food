-- Corrige duas coisas na contagem de uso de cupom:
-- 1. Condição de corrida: dois checkouts quase simultâneos liam o mesmo
--    used_count e cada um escrevia used_count+1 por cima do outro (uma
--    das duas contagens se perdia). Increment/decrement agora acontece
--    dentro do próprio banco (update ... set used_count = used_count + N),
--    atômico por linha.
-- 2. RLS silenciosamente bloqueava esse update pra clientes logados: a
--    policy "coupons_staff" só permite UPDATE por staff/master_admin, e
--    o cliente comum não é nenhum dos dois — o incremento nunca acontecia
--    de verdade fora do checkout como convidado (que usa o client admin).
--    security definer faz a função rodar com privilégio de dono, então
--    funciona pros dois casos.
create or replace function public.adjust_coupon_usage(p_coupon_id uuid, p_delta int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons
  set used_count = greatest(0, used_count + p_delta)
  where id = p_coupon_id;
$$;

grant execute on function public.adjust_coupon_usage(uuid, int) to authenticated, anon;
