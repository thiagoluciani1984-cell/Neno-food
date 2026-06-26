-- =====================================================================
-- 0010 · Habilita Realtime (Postgres changes) nas tabelas necessárias
-- =====================================================================

-- KDS (cozinha) e tracking do cliente dependem de mudanças em orders.
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.notifications;
