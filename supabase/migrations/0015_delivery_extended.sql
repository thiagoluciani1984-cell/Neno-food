-- =====================================================================
-- 0015 · Delivery estendido
--   • order_status_history  — log de mudanças de status do pedido
--   • delivery_tracking     — posições GPS do entregador por pedido
--   • delivery_codes        — código de confirmação de entrega (PIN/QR)
--   • Novas colunas em orders (timestamps extras)
-- =====================================================================

-- ─── orders: timestamps adicionais ───────────────────────────────────
alter table public.orders
  add column if not exists prepared_at   timestamptz,  -- saiu da cozinha
  add column if not exists picked_up_at  timestamptz,  -- entregador coletou
  add column if not exists rated_at      timestamptz;  -- cliente avaliou

-- ─── order_status_history ────────────────────────────────────────────
-- Log imutável de todas as transições de status do pedido.
create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  changed_by  uuid references public.profiles (id) on delete set null, -- quem mudou (null = sistema)
  notes       text,
  created_at  timestamptz not null default now()
);

-- Trigger: ao atualizar status do pedido, registra histórico automaticamente
create or replace function public.record_order_status_change()
returns trigger language plpgsql as $$
begin
  if new.status <> old.status then
    insert into public.order_status_history (order_id, status, created_at)
    values (new.id, new.status, now());
  end if;
  return new;
end;
$$;

create trigger trg_order_status_history
  after update of status on public.orders
  for each row execute function public.record_order_status_change();

-- ─── delivery_tracking ───────────────────────────────────────────────
-- Snapshot de posição do entregador durante a entrega de UM pedido específico.
-- Retido por 90 dias.
create table if not exists public.delivery_tracking (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  latitude    numeric(10,7) not null,
  longitude   numeric(10,7) not null,
  heading     numeric(5,2),
  speed       numeric(6,2),
  created_at  timestamptz not null default now()
);

-- ─── delivery_codes ──────────────────────────────────────────────────
-- Código de 4–6 dígitos (ou token) para confirmar a entrega ao cliente.
-- O entregador insere o código que o cliente mostra.
create table if not exists public.delivery_codes (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null unique references public.orders (id) on delete cascade,
  code          text not null,
  confirmed_at  timestamptz,
  confirmed_by  uuid references public.drivers (id) on delete set null,
  expires_at    timestamptz not null default (now() + interval '48 hours'),
  created_at    timestamptz not null default now()
);

-- ─── Storage bucket privado para documentos ──────────────────────────
-- (executado aqui para manter a sequência; bucket policy via service_role)
insert into storage.buckets (id, name, public)
values ('driver-docs', 'driver-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('restaurant-docs', 'restaurant-docs', false)
on conflict (id) do nothing;
