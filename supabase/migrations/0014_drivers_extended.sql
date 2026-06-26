-- =====================================================================
-- 0014 · Entregadores estendidos
--   • Novas colunas em drivers (dados pessoais, financeiros, aprovação)
--   • driver_documents  — docs de habilitação/identidade — PRIVADO
--   • driver_vehicles   — veículos cadastrados
--   • driver_verifications — checagem de documentos pelo admin
--   • driver_locations  — histórico de posição (GPS)
-- =====================================================================

-- ─── drivers: novas colunas ──────────────────────────────────────────
alter table public.drivers
  add column if not exists cpf                       text unique,
  add column if not exists birth_date                date,
  add column if not exists approval_status           public.driver_approval_status not null default 'pending',
  add column if not exists rejection_reason          text,
  add column if not exists suspension_reason         text,
  add column if not exists suspended_until           timestamptz,
  -- Chave Pix para repasse de ganhos
  add column if not exists pix_key                   text,
  add column if not exists pix_key_type              text check (pix_key_type in ('cpf','email','phone','random','cnpj')),
  add column if not exists bank_name                 text,
  add column if not exists bank_agency               text,
  add column if not exists bank_account              text,
  -- Contato de emergência
  add column if not exists emergency_contact_name    text,
  add column if not exists emergency_contact_phone   text,
  -- Localização em tempo real (snapshot)
  add column if not exists current_latitude          numeric(10,7),
  add column if not exists current_longitude         numeric(10,7),
  add column if not exists current_heading           numeric(5,2),
  add column if not exists last_location_at          timestamptz,
  -- Aprovação
  add column if not exists approved_at               timestamptz,
  add column if not exists approved_by               uuid references public.profiles (id) on delete set null;

-- ─── driver_documents ────────────────────────────────────────────────
-- Bucket PRIVADO: driver-docs/<driver_id>/<doc_type>/<filename>
-- Acesso via signed URL gerada pelo service_role.
create table if not exists public.driver_documents (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references public.drivers (id) on delete cascade,
  doc_type      text not null,  -- cnh_front, cnh_back, id_front, id_back, selfie, proof_of_address
  storage_path  text not null,  -- path no bucket privado
  original_name text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  expires_at    timestamptz,    -- para CNH e docs com validade
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── driver_vehicles ─────────────────────────────────────────────────
create table if not exists public.driver_vehicles (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  type        text not null default 'motorcycle', -- motorcycle, bicycle, car, van
  brand       text,
  model       text,
  year        smallint check (year between 1970 and 2100),
  color       text,
  plate       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── driver_verifications ────────────────────────────────────────────
-- Checklist de verificação por parte do admin (antecedentes, docs, etc.)
create table if not exists public.driver_verifications (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references public.drivers (id) on delete cascade,
  check_type    text not null,  -- background_check, cnh_valid, address_confirmed...
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes         text,
  verified_by   uuid references public.profiles (id) on delete set null,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ─── driver_locations ────────────────────────────────────────────────
-- Histórico de posições — gravado enquanto entregador está em status 'busy'
-- Retido por 30 dias (pode ser limpo por job agendado)
create table if not exists public.driver_locations (
  id          bigint generated always as identity primary key,
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  latitude    numeric(10,7) not null,
  longitude   numeric(10,7) not null,
  heading     numeric(5,2),   -- direção em graus (0–359)
  speed       numeric(6,2),   -- km/h
  created_at  timestamptz not null default now()
);

-- ─── Triggers ────────────────────────────────────────────────────────
create trigger trg_driver_documents_updated_at
  before update on public.driver_documents
  for each row execute function public.set_updated_at();

create trigger trg_driver_vehicles_updated_at
  before update on public.driver_vehicles
  for each row execute function public.set_updated_at();

-- ─── Helper: current_driver_id já existe em 0008, mantido ────────────
