-- A policy "restaurants_update" (0008) permite que o dono do restaurante
-- atualize qualquer coluna da própria linha, incluindo status/aprovação —
-- ou seja, mesmo com a correção no server action (setRestaurantStatusAction
-- agora exige master_admin), um dono tecnicamente poderia chamar a API do
-- Supabase direto (fora da nossa tela) e se auto-aprovar ou reativar um
-- restaurante bloqueado. Este trigger reverte essas colunas se quem
-- alterou não for master_admin, independente de como o update chegou.
create or replace function public.protect_restaurant_status_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_master_admin() then
    -- status (pending/active/blocked) é 100% decisão do admin.
    new.status := old.status;
    new.approved_at := old.approved_at;

    -- onboarding_status: o dono pode ir de draft -> in_review sozinho
    -- (enviar pra análise), mas só o admin decide approved/rejected.
    if new.onboarding_status in ('approved', 'rejected')
       and old.onboarding_status is distinct from new.onboarding_status then
      new.onboarding_status := old.onboarding_status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_restaurant_status on public.restaurants;
create trigger trg_protect_restaurant_status
  before update of status, onboarding_status, approved_at on public.restaurants
  for each row execute function public.protect_restaurant_status_columns();
