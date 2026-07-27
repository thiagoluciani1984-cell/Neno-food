-- Aceite automático de pedidos: quando ativado e o restaurante está aberto
-- (is_open = true), um pedido que chega como "received" já entra direto
-- como "confirmed", sem precisar de clique manual do restaurante.
alter table public.restaurant_settings
  add column if not exists auto_accept_orders boolean not null default false;

comment on column public.restaurant_settings.auto_accept_orders is
  'Se true, pedidos novos (status received) sao confirmados automaticamente enquanto is_open = true.';

create or replace function public.auto_confirm_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_open boolean;
  v_auto_accept boolean;
begin
  if new.status <> 'received' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'received' then
    return new;
  end if;

  select is_open, auto_accept_orders
    into v_is_open, v_auto_accept
    from public.restaurant_settings
    where restaurant_id = new.restaurant_id;

  if coalesce(v_is_open, false) and coalesce(v_auto_accept, false) then
    new.status := 'confirmed';
    new.confirmed_at := coalesce(new.confirmed_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_confirm_order on public.orders;
create trigger trg_auto_confirm_order
  before insert or update of status on public.orders
  for each row execute function public.auto_confirm_order();
