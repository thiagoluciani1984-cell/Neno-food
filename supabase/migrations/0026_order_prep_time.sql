-- =====================================================================
-- 0026 · Tempo de preparo estimado por pedido
-- Guardamos só a duração (minutos); o horário previsto é sempre
-- derivado de confirmed_at (ou created_at, antes da confirmação) +
-- prep_minutes, calculado na UI — evita duas fontes de verdade.
-- =====================================================================

alter table public.orders
  add column if not exists prep_minutes integer not null default 40 check (prep_minutes >= 0);
