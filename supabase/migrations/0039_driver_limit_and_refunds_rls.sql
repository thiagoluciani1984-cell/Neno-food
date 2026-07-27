-- Corrige corrida onde um entregador podia aceitar mais de MAX_ACTIVE_ORDERS
-- (3) pedidos simultâneos: a checagem de contagem na aplicação e o update
-- atômico da linha são dois passos separados, então dois cliques quase
-- juntos (ou duas abas) liam a mesma contagem antes de qualquer um dos
-- dois updates acontecer. Trava por advisory lock (por driver) garante que
-- as tentativas concorrentes do MESMO entregador rodem uma de cada vez.
create or replace function public.enforce_max_active_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if new.status = 'out_for_delivery' and new.driver_id is not null then
    perform pg_advisory_xact_lock(hashtext(new.driver_id::text));

    select count(*) into v_count
    from public.orders
    where driver_id = new.driver_id
      and status = 'out_for_delivery'
      and id <> new.id;

    if v_count >= 3 then
      raise exception 'MAX_ACTIVE_ORDERS_EXCEEDED';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_max_active_orders on public.orders;
create trigger trg_enforce_max_active_orders
  before update of driver_id, status on public.orders
  for each row execute function public.enforce_max_active_orders();

-- Fecha uma brecha de RLS na tabela de reembolsos (ainda não usada por
-- nenhuma tela do app, mas a policy de insert só conferia quem pediu,
-- nunca se o order_id pedido é realmente do próprio cliente).
drop policy if exists "refunds_insert" on public.refunds;
create policy "refunds_insert" on public.refunds
  for insert with check (
    public.is_master_admin()
    or (
      requested_by = auth.uid()
      and order_id in (
        select o.id from public.orders o
        join public.customers c on c.id = o.customer_id
        where c.profile_id = auth.uid()
      )
    )
  );
