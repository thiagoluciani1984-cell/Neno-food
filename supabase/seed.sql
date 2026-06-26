-- =====================================================================
-- SEED · Luciani's Di Qualità — Lasanhas & Risotos
-- Restaurante inicial + cardápio. (Execução idempotente por slug.)
-- Obs.: usuários/contas são criados via Supabase Auth (signup) e o
-- profile é provisionado pelo trigger handle_new_user.
-- =====================================================================

do $$
declare
  v_restaurant_id uuid;
  v_cat_lasanhas  uuid;
  v_cat_risotos   uuid;
  v_cat_parmegianas uuid;
  v_cat_massas    uuid;
  v_cat_entradas  uuid;
  v_cat_sobremesas uuid;
  v_cat_bebidas   uuid;
begin
  -- ─── Restaurante ───────────────────────────────────────────────────
  insert into public.restaurants (name, slug, description, cuisine, status, phone)
  values (
    'Luciani''s Di Qualità',
    'lucianis-di-qualita',
    'Lasanhas & Risotos artesanais. Autêntica culinária italiana feita com ingredientes selecionados.',
    'Italiana',
    'active',
    '(11) 90000-0000'
  )
  on conflict (slug) do update set name = excluded.name
  returning id into v_restaurant_id;

  if v_restaurant_id is null then
    select id into v_restaurant_id from public.restaurants where slug = 'lucianis-di-qualita';
  end if;

  -- ─── Configurações ─────────────────────────────────────────────────
  insert into public.restaurant_settings (
    restaurant_id, is_open, delivery_fee_cents, free_delivery_above_cents,
    min_order_cents, avg_prep_minutes, opening_hours, payment_methods,
    address_city, address_state
  )
  values (
    v_restaurant_id, true, 899, 12000, 3000, 45,
    '{"1":{"open":"18:00","close":"23:00","enabled":true},
      "2":{"open":"18:00","close":"23:00","enabled":true},
      "3":{"open":"18:00","close":"23:00","enabled":true},
      "4":{"open":"18:00","close":"23:00","enabled":true},
      "5":{"open":"18:00","close":"23:30","enabled":true},
      "6":{"open":"12:00","close":"23:30","enabled":true},
      "0":{"open":"12:00","close":"22:00","enabled":true}}'::jsonb,
    array['pix','cash','card']::public.payment_method[],
    'São Paulo', 'SP'
  )
  on conflict (restaurant_id) do nothing;

  -- ─── Categorias ────────────────────────────────────────────────────
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Lasanhas', 'lasanhas', 1)        returning id into v_cat_lasanhas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Risotos', 'risotos', 2)          returning id into v_cat_risotos;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Parmegianas', 'parmegianas', 3)  returning id into v_cat_parmegianas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Massas', 'massas', 4)            returning id into v_cat_massas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Entradas', 'entradas', 5)        returning id into v_cat_entradas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Sobremesas', 'sobremesas', 6)    returning id into v_cat_sobremesas;
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_restaurant_id, 'Bebidas', 'bebidas', 7)          returning id into v_cat_bebidas;

  -- ─── Produtos ──────────────────────────────────────────────────────
  insert into public.products
    (restaurant_id, category_id, name, slug, description, price_cents, promo_price_cents, is_featured, is_available)
  values
    -- Lasanhas
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha à Bolonhesa', 'lasanha-bolonhesa',
     'Camadas de massa fresca, molho bolonhesa artesanal e queijo gratinado.', 4990, 4490, true, true),
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha de Frango Cremoso', 'lasanha-frango-cremoso',
     'Frango desfiado ao molho branco com requeijão e mussarela.', 4790, null, true, true),
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha 4 Queijos', 'lasanha-4-queijos',
     'Mussarela, provolone, gorgonzola e parmesão em molho cremoso.', 5290, null, false, true),
    (v_restaurant_id, v_cat_lasanhas, 'Lasanha de Camarão', 'lasanha-camarao',
     'Camarões selecionados ao molho rosé com toque de manjericão.', 6990, null, true, true),
    -- Risotos
    (v_restaurant_id, v_cat_risotos, 'Risoto de Camarão', 'risoto-camarao',
     'Arroz arbóreo cremoso com camarões e finalização de limão siciliano.', 6490, null, true, true),
    (v_restaurant_id, v_cat_risotos, 'Risoto de Tilápia', 'risoto-tilapia',
     'Tilápia grelhada com risoto ao vinho branco e ervas.', 5490, null, false, true),
    (v_restaurant_id, v_cat_risotos, 'Risoto de Funghi', 'risoto-funghi',
     'Mix de cogumelos, parmesão e azeite trufado.', 5790, 5290, true, true),
    -- Parmegianas
    (v_restaurant_id, v_cat_parmegianas, 'Parmegiana de Frango', 'parmegiana-frango',
     'Filé de frango empanado, molho de tomate e mussarela gratinada. Acompanha arroz.', 4690, null, false, true),
    (v_restaurant_id, v_cat_parmegianas, 'Parmegiana de Carne', 'parmegiana-carne',
     'Filé de carne empanado ao molho e queijo. Acompanha arroz.', 5290, null, false, true),
    (v_restaurant_id, v_cat_parmegianas, 'Parmegiana de Filé Mignon', 'parmegiana-file-mignon',
     'Medalhões de filé mignon empanados, molho rústico e mussarela.', 6990, null, true, true),
    -- Massas
    (v_restaurant_id, v_cat_massas, 'Espaguete ao Sugo', 'espaguete-sugo',
     'Espaguete artesanal ao molho de tomate fresco e manjericão.', 3890, null, false, true),
    (v_restaurant_id, v_cat_massas, 'Talharim ao Funghi', 'talharim-funghi',
     'Talharim com molho cremoso de cogumelos.', 4690, null, false, true),
    (v_restaurant_id, v_cat_massas, 'Nhoque ao Pomodoro', 'nhoque-pomodoro',
     'Nhoque de batata ao molho pomodoro e parmesão.', 4290, null, false, true),
    (v_restaurant_id, v_cat_massas, 'Ravioli de Queijo', 'ravioli-queijo',
     'Ravioli recheado com queijos ao molho de manteiga e sálvia.', 4990, null, false, true),
    -- Entradas
    (v_restaurant_id, v_cat_entradas, 'Bruschetta Clássica', 'bruschetta-classica',
     'Pão italiano, tomate, manjericão e azeite extravirgem.', 2490, null, false, true),
    (v_restaurant_id, v_cat_entradas, 'Tábua de Frios', 'tabua-de-frios',
     'Seleção de queijos e embutidos italianos.', 4490, null, false, true),
    -- Sobremesas
    (v_restaurant_id, v_cat_sobremesas, 'Tiramisù', 'tiramisu',
     'Clássico italiano com café, mascarpone e cacau.', 2690, null, true, true),
    (v_restaurant_id, v_cat_sobremesas, 'Petit Gâteau', 'petit-gateau',
     'Bolo quente de chocolate com sorvete de creme.', 2890, null, false, true),
    -- Bebidas
    (v_restaurant_id, v_cat_bebidas, 'Água Mineral 500ml', 'agua-mineral',
     'Sem gás.', 590, null, false, true),
    (v_restaurant_id, v_cat_bebidas, 'Refrigerante Lata', 'refrigerante-lata',
     'Coca-Cola, Guaraná ou Soda.', 790, null, false, true),
    (v_restaurant_id, v_cat_bebidas, 'Suco Natural 300ml', 'suco-natural',
     'Laranja, limão ou maracujá.', 1190, null, false, true)
  on conflict (restaurant_id, slug) do nothing;

  -- ─── Cupom de boas-vindas ──────────────────────────────────────────
  insert into public.coupons
    (restaurant_id, code, type, value_percent, min_order_cents, is_active)
  values
    (v_restaurant_id, 'BEMVINDO10', 'percentage', 10, 4000, true)
  on conflict (restaurant_id, code) do nothing;

end;
$$;
