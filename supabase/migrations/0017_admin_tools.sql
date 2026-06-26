-- =====================================================================
-- 0017 · Ferramentas administrativas
--   • audit_logs       — trilha de auditoria imutável
--   • support_tickets  — chamados de suporte
--   • ticket_messages  — mensagens dentro de um chamado
--   • refunds          — solicitações de reembolso
-- =====================================================================

-- ─── audit_logs ──────────────────────────────────────────────────────
-- Log imutável. Nenhuma UPDATE/DELETE permitida via RLS.
-- Escrito apenas via service_role (server actions) ou triggers.
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,  -- quem fez a ação
  action       public.audit_action not null,
  entity_type  text not null,          -- 'restaurant', 'driver', 'order', 'product'...
  entity_id    uuid,                   -- id da entidade afetada
  restaurant_id uuid references public.restaurants (id) on delete set null, -- contexto de tenant
  old_data     jsonb,                  -- snapshot antes
  new_data     jsonb,                  -- snapshot depois
  ip_addr      inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

-- ─── support_tickets ─────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles (id) on delete cascade,
  assigned_to   uuid references public.profiles (id) on delete set null, -- moderador/admin
  restaurant_id uuid references public.restaurants (id) on delete set null, -- contexto, se aplicável
  ticket_type   text not null default 'general', -- general, payment, delivery, account, content
  subject       text not null,
  body          text not null,
  status        public.ticket_status not null default 'open',
  priority      text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── ticket_messages ─────────────────────────────────────────────────
create table if not exists public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  is_internal boolean not null default false, -- nota interna (visível só para staff)
  created_at  timestamptz not null default now()
);

-- ─── refunds ─────────────────────────────────────────────────────────
create table if not exists public.refunds (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  requested_by    uuid not null references public.profiles (id) on delete cascade,
  approved_by     uuid references public.profiles (id) on delete set null,
  amount_cents    integer not null check (amount_cents > 0),
  reason          text not null,       -- produto errado, não entregue, qualidade...
  status          public.refund_status not null default 'requested',
  rejection_note  text,
  payment_ref     text,                -- id da transação de estorno no gateway
  processed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Triggers ────────────────────────────────────────────────────────
create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

create trigger trg_refunds_updated_at
  before update on public.refunds
  for each row execute function public.set_updated_at();
