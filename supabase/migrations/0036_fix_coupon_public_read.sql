-- Bug pré-existente: a policy "coupons_staff" (0008_rls_policies.sql) só
-- permite leitura pro dono do restaurante ou master_admin — nenhum cliente
-- conseguia validar cupom no checkout, porque nem enxergava a linha via RLS.
-- Adiciona leitura pública de cupons ATIVOS (dado não sensível — o cliente
-- já precisa saber o código pra usar). A policy de gestão (staff) continua
-- controlando insert/update/delete normalmente.
drop policy if exists "coupons_public_select" on public.coupons;
create policy "coupons_public_select" on public.coupons
  for select using (is_active = true);
