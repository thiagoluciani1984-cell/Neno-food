-- =====================================================================
-- 0011 · Enums estendidos
--   • user_role       → staff, moderator
--   • order_status    → payment_pending
--   • Novos enums:    onboarding_status, driver_approval_status,
--                     post_type, image_source, ticket_status,
--                     refund_status, option_type, audit_action
-- =====================================================================

-- ─── user_role ────────────────────────────────────────────────────────
alter type public.user_role add value if not exists 'staff';
alter type public.user_role add value if not exists 'moderator';

-- ─── order_status ─────────────────────────────────────────────────────
-- payment_pending: aguardando confirmação de pagamento (antes de received)
alter type public.order_status add value if not exists 'payment_pending';

-- ─── onboarding_status ────────────────────────────────────────────────
-- Estado do processo de aprovação do restaurante
do $$ begin
  create type public.onboarding_status as enum (
    'draft',       -- preenchendo cadastro
    'in_review',   -- documentos enviados, aguardando análise
    'approved',    -- aprovado e ativo
    'rejected'     -- recusado (com motivo)
  );
exception when duplicate_object then null; end $$;

-- ─── driver_approval_status ───────────────────────────────────────────
do $$ begin
  create type public.driver_approval_status as enum (
    'pending',     -- cadastro enviado
    'approved',    -- entregador aprovado
    'rejected',    -- documentos recusados
    'suspended'    -- suspenso temporariamente
  );
exception when duplicate_object then null; end $$;

-- ─── post_type ────────────────────────────────────────────────────────
do $$ begin
  create type public.post_type as enum (
    'photo',
    'text',
    'video',
    'story'
  );
exception when duplicate_object then null; end $$;

-- ─── image_source ─────────────────────────────────────────────────────
do $$ begin
  create type public.image_source as enum (
    'upload',        -- enviado pelo restaurante
    'nenos_studio'   -- escolhido da biblioteca Nenos Studio
  );
exception when duplicate_object then null; end $$;

-- ─── ticket_status ────────────────────────────────────────────────────
do $$ begin
  create type public.ticket_status as enum (
    'open',
    'in_progress',
    'resolved',
    'closed'
  );
exception when duplicate_object then null; end $$;

-- ─── refund_status ────────────────────────────────────────────────────
do $$ begin
  create type public.refund_status as enum (
    'requested',
    'approved',
    'rejected',
    'processed'
  );
exception when duplicate_object then null; end $$;

-- ─── option_type ──────────────────────────────────────────────────────
-- single: apenas 1 item selecionável (ex: tamanho) / multiple: N itens
do $$ begin
  create type public.option_type as enum (
    'single',
    'multiple'
  );
exception when duplicate_object then null; end $$;

-- ─── audit_action ─────────────────────────────────────────────────────
do $$ begin
  create type public.audit_action as enum (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'approve',
    'reject',
    'suspend',
    'restore'
  );
exception when duplicate_object then null; end $$;
