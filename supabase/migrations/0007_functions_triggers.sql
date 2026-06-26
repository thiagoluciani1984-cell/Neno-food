-- =====================================================================
-- 0007 · Funções helper (RLS), triggers de updated_at e
--        provisionamento automático de profile no signup
-- =====================================================================

-- ─── updated_at automático ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','restaurants','restaurant_settings','categories','products',
    'customers','addresses','drivers','coupons','orders','payments'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ─── Funções de contexto para RLS ────────────────────────────────────
-- Lê o papel do usuário autenticado (security definer evita recursão RLS).

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'master_admin'
  );
$$;

-- restaurant_id ao qual o usuário autenticado pertence (restaurant/driver)
create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.profiles where id = auth.uid();
$$;

-- customer_id do usuário autenticado (se for cliente)
create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.customers where profile_id = auth.uid();
$$;

-- ─── Provisionamento automático no signup ────────────────────────────
-- Ao criar um auth.user, cria o profile (role vem do metadata, default customer)
-- e, se for cliente, também cria o registro em customers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'customer'
  );

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );

  if v_role = 'customer' then
    insert into public.customers (profile_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Recalcular total de um pedido a partir dos itens ────────────────
create or replace function public.recalc_order_totals(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  v_subtotal integer;
begin
  select coalesce(sum(total_cents), 0) into v_subtotal
  from public.order_items where order_id = p_order_id;

  update public.orders
  set subtotal_cents = v_subtotal,
      total_cents = greatest(0, v_subtotal + delivery_fee_cents - discount_cents)
  where id = p_order_id;
end;
$$;
