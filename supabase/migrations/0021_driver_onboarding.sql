-- =====================================================================
-- 0021 · Onboarding de Entregadores
--   • storage.objects policies para driver-docs
--   • Trigger: ao criar profile com role=driver, cria registro em drivers
-- =====================================================================

-- ─── Storage: driver-docs (bucket PRIVADO) ───────────────────────────
-- Entregador pode fazer upload e ler os próprios docs.
-- Admin (service_role) lê via signed URL gerada no servidor.

create policy "driver_docs_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'driver-docs'
    and (storage.foldername(name))[1] = (
      select d.id::text
      from public.drivers d
      join public.profiles p on p.id = d.profile_id
      where p.id = auth.uid()
      limit 1
    )
  );

create policy "driver_docs_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'driver-docs'
    and (
      -- próprio entregador
      (storage.foldername(name))[1] = (
        select d.id::text
        from public.drivers d
        join public.profiles p on p.id = d.profile_id
        where p.id = auth.uid()
        limit 1
      )
      -- admin sempre pode ler
      or public.is_master_admin()
    )
  );

create policy "driver_docs_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'driver-docs'
    and (
      (storage.foldername(name))[1] = (
        select d.id::text
        from public.drivers d
        join public.profiles p on p.id = d.profile_id
        where p.id = auth.uid()
        limit 1
      )
      or public.is_master_admin()
    )
  );

-- ─── Trigger: auto-create drivers record ─────────────────────────────
-- Extende handle_new_user: se role=driver, cria o registro na tabela drivers.
-- (handle_new_user já cria o profile; aqui só complementamos com o driver.)

create or replace function public.handle_new_driver()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'driver' then
    insert into public.drivers (profile_id, vehicle_type, status)
    values (new.id, 'motorcycle', 'offline')
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_driver_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_driver();
