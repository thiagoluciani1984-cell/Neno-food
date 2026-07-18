-- =====================================================================
-- 0027 · Clientes convidados "lembrados pelo navegador"
-- Permite que um pedido de convidado (sem login) vire um registro
-- reaproveitável em `customers`, identificado por um token opaco
-- guardado num cookie do navegador (não por telefone/CPF público —
-- evita que alguém descubra dados de outra pessoa só sabendo o
-- telefone dela). Acesso sempre via service_role (bypassa RLS),
-- igual ao padrão já usado para pedidos de convidado.
-- =====================================================================

alter table public.customers
  alter column profile_id drop not null,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists guest_token uuid unique default gen_random_uuid();
