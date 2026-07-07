-- =====================================================================
-- 0023 · Realtime para posições GPS do entregador (mapa do cliente)
-- =====================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'delivery_tracking'
  ) then
    alter publication supabase_realtime add table public.delivery_tracking;
  end if;
end $$;
