/* Cadastra o Poit da Pizza como segundo restaurante na plataforma. */
const { Client } = require("pg");

const ref = process.env.PROJECT_REF || "lelimqdzvwafxzvrkszj";
const password = process.env.PGPW;
if (!password) { console.error("Defina PGPW."); process.exit(1); }

const sql = `
do $$
declare
  v_id uuid;
begin
  -- Restaurante
  insert into public.restaurants (name, slug, description, cuisine, status, phone)
  values (
    'Poit da Pizza',
    'poit-da-pizza',
    'As melhores pizzas artesanais da região. Massa fina, ingredientes frescos e muito sabor.',
    'Italiana',
    'active',
    '(11) 90000-0001'
  )
  on conflict (slug) do update set name = excluded.name
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.restaurants where slug = 'poit-da-pizza';
  end if;

  -- Configurações padrão
  insert into public.restaurant_settings (
    restaurant_id, is_open, delivery_fee_cents, free_delivery_above_cents,
    min_order_cents, avg_prep_minutes, opening_hours, payment_methods,
    address_city, address_state
  )
  values (
    v_id, true, 599, 8000, 2500, 35,
    '{"0":{"open":"18:00","close":"23:00","enabled":true},
      "1":{"open":"18:00","close":"23:00","enabled":true},
      "2":{"open":"18:00","close":"23:00","enabled":true},
      "3":{"open":"18:00","close":"23:00","enabled":true},
      "4":{"open":"18:00","close":"23:00","enabled":true},
      "5":{"open":"18:00","close":"00:00","enabled":true},
      "6":{"open":"18:00","close":"00:00","enabled":true}}'::jsonb,
    array['pix','cash','card']::public.payment_method[],
    'São Paulo', 'SP'
  )
  on conflict (restaurant_id) do nothing;

  -- Categorias padrão de pizzaria (cardápio detalhado vem depois)
  insert into public.categories (restaurant_id, name, slug, sort_order) values
    (v_id, 'Pizzas Salgadas',  'pizzas-salgadas',  1),
    (v_id, 'Pizzas Doces',     'pizzas-doces',     2),
    (v_id, 'Entradas',         'entradas',         3),
    (v_id, 'Bebidas',          'bebidas',          4)
  on conflict (restaurant_id, slug) do nothing;

  raise notice 'Poit da Pizza criado: %', v_id;
end;
$$;
`;

(async () => {
  const client = new Client({
    host: "aws-1-sa-east-1.pooler.supabase.com",
    port: 5432,
    user: `postgres.${ref}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  await client.connect();
  const res = await client.query(sql);
  // Captura o NOTICE
  console.log("✅ Poit da Pizza cadastrado!");
  // Lista restaurantes ativos
  const { rows } = await client.query(
    "select name, slug, status from public.restaurants order by created_at"
  );
  console.log("\nRestaurantes na plataforma:");
  rows.forEach(r => console.log(`  [${r.status}] ${r.name}  →  /${r.slug}`));
  await client.end();
})().catch(e => { console.error("ERRO:", e.message); process.exit(2); });
