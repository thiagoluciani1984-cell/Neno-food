-- =====================================================================
-- 0032 · Cor de marca por restaurante
-- Permite cada restaurante ter sua própria identidade visual (ex.:
-- verde/dourado pro Luciani's sem
-- afetar a cor padrão da plataforma (laranja Nenos Food) em nenhum
-- outro lugar. Nulo = usa o laranja padrão.
-- =====================================================================

alter table public.restaurants
  add column if not exists theme_primary text,
  add column if not exists theme_secondary text;

update public.restaurants set theme_primary = '#1B4332', theme_secondary = '#C9A227'
  where slug = 'lucianis-di-qualita';

