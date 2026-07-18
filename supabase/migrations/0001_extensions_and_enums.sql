-- =====================================================================
-- 0001 · Extensões e tipos enumerados
-- Di Qualità Food — base do schema multi-tenant
-- =====================================================================

create extension if not exists "pgcrypto";        -- gen_random_uuid()
create extension if not exists "citext";           -- e-mails case-insensitive
create extension if not exists "pg_trgm";          -- busca textual em produtos

-- ─── Enums de domínio ────────────────────────────────────────────────
-- Cada CREATE TYPE é envolvido num bloco que ignora "já existe" (42710),
-- pra ser seguro rodar de novo num banco parcialmente migrado.

do $$ begin
  create type public.user_role as enum (
    'master_admin',
    'restaurant',
    'customer',
    'driver'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.restaurant_status as enum (
    'pending',   -- aguardando aprovação do master admin
    'active',
    'blocked'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_type as enum (
    'delivery',
    'pickup',    -- retirada no balcão
    'dine_in'    -- consumo local
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'received',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum (
    'pix',
    'cash',
    'card',
    'online'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'failed',
    'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.coupon_type as enum (
    'percentage',
    'fixed',
    'free_shipping'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.driver_status as enum (
    'offline',
    'available',
    'busy'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'order_update',
    'promotion',
    'system'
  );
exception when duplicate_object then null; end $$;
