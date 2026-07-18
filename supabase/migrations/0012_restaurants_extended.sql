-- =====================================================================
-- 0012 · Restaurantes estendidos
--   • Novas colunas em restaurants (cadastro completo, onboarding)
--   • restaurant_staff  — membros da equipe do restaurante
--   • restaurant_documents — documentos (CNPJ, alvará, etc.) — PRIVADO
--   • restaurant_followers — clientes que seguem o restaurante
-- =====================================================================

-- ─── restaurants: novas colunas ──────────────────────────────────────
alter table public.restaurants
  add column if not exists cnpj                text unique,
  add column if not exists whatsapp            text,
  add column if not exists instagram           text,
  add column if not exists website             text,
  add column if not exists history             text,           -- história/sobre
  add column if not exists chef_name           text,
  add column if not exists price_range         smallint check (price_range between 1 and 4),
  add column if not exists establishment_type  text not null default 'restaurant',
  add column if not exists onboarding_status   public.onboarding_status not null default 'draft',
  add column if not exists registration_step   smallint not null default 1 check (registration_step between 1 and 4),
  add column if not exists rejection_reason    text,          -- motivo de recusa
  add column if not exists avg_rating          numeric(3,2) not null default 0 check (avg_rating between 0 and 5),
  add column if not exists total_reviews       integer not null default 0 check (total_reviews >= 0),
  add column if not exists total_orders        integer not null default 0 check (total_orders >= 0),
  add column if not exists is_verified         boolean not null default false,
  add column if not exists approved_at         timestamptz,
  add column if not exists approved_by         uuid references public.profiles (id) on delete set null;

-- ─── restaurant_staff ────────────────────────────────────────────────
-- Membros da equipe: caixa, gerente, atendente, cozinheiro, etc.
create table if not exists public.restaurant_staff (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  job_title     text not null default 'staff',  -- gerente, caixa, atendente...
  permissions   text[] not null default '{}',   -- lista de permissões granulares (futuro)
  is_active     boolean not null default true,
  invited_by    uuid references public.profiles (id) on delete set null,
  invited_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, profile_id)
);

-- ─── restaurant_documents ────────────────────────────────────────────
-- Documentos jurídicos — bucket PRIVADO, acesso via signed URL.
create table if not exists public.restaurant_documents (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  doc_type      text not null,   -- cnpj_card, social_contract, health_permit, menu_photo...
  storage_path  text not null,   -- path dentro do bucket privado
  original_name text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── restaurant_followers ────────────────────────────────────────────
create table if not exists public.restaurant_followers (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (restaurant_id, profile_id)
);

-- ─── Trigger updated_at ──────────────────────────────────────────────
drop trigger if exists trg_restaurant_staff_updated_at on public.restaurant_staff;
create trigger trg_restaurant_staff_updated_at
  before update on public.restaurant_staff
  for each row execute function public.set_updated_at();

drop trigger if exists trg_restaurant_documents_updated_at on public.restaurant_documents;
create trigger trg_restaurant_documents_updated_at
  before update on public.restaurant_documents
  for each row execute function public.set_updated_at();

-- ─── Função helper: is_restaurant_staff ──────────────────────────────
-- Retorna true se o usuário autenticado é staff do restaurante em questão.
create or replace function public.is_restaurant_staff(p_restaurant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.restaurant_staff
    where restaurant_id = p_restaurant_id
      and profile_id    = auth.uid()
      and is_active     = true
  );
$$;
