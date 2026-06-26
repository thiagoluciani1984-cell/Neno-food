/* Popula o cardápio completo do Poit da Pizza extraído das imagens do iFood. */
const { Client } = require("pg");

const ref = process.env.PROJECT_REF || "lelimqdzvwafxzvrkszj";
const pw = process.env.PGPW;
if (!pw) { console.error("Defina PGPW."); process.exit(1); }

/* ─── Cardápio completo ──────────────────────────────────────────────────── */
const CATALOG = [
  {
    category: { name: "Pizza Individual (4 fatias)", slug: "pizza-individual", sort_order: 1 },
    products: [
      {
        name: "Calabresa Acebolada (4 fatias)",
        slug: "calabresa-acebolada-4",
        description: "Molho de tomate, muçarela, calabresa, cebola, orégano e azeite. Massa fina artesanal.",
        price_cents: 3490, promo_price_cents: null, is_featured: true,
      },
      {
        name: "Muçarela (4 fatias)",
        slug: "mucarela-4",
        description: "Molho de tomate, muçarela, tomate, orégano e azeitonas. Simples e irresistível.",
        price_cents: 3490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Frango com Muçarela (4 fatias)",
        slug: "frango-mucarela-4",
        description: "Molho de tomate, muçarela, frango desfiado, orégano e azeite.",
        price_cents: 3490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Frango com Requeijão Cremoso (4 fatias)",
        slug: "frango-requeijao-4",
        description: "Molho de tomate, muçarela, frango desfiado, requeijão cremoso e orégano.",
        price_cents: 3490, promo_price_cents: null, is_featured: true,
      },
    ],
  },
  {
    category: { name: "Pizza Média (6 fatias)", slug: "pizza-media", sort_order: 2 },
    products: [
      {
        name: "Calabresa (6 fatias)",
        slug: "calabresa-6",
        description: "Molho de tomate, muçarela, calabresa, cebola, orégano e azeite.",
        price_cents: 4490, promo_price_cents: 3490, is_featured: true,
      },
      {
        name: "Muçarela (6 fatias)",
        slug: "mucarela-6",
        description: "Molho de tomate, muçarela, tomate, orégano e azeitonas.",
        price_cents: 4490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Frango com Catupiry Original (6 fatias)",
        slug: "frango-catupiry-6",
        description: "Molho de tomate, muçarela, frango desfiado, Catupiry Original e orégano.",
        price_cents: 4990, promo_price_cents: null, is_featured: true,
      },
      {
        name: "Portuguesa (6 fatias)",
        slug: "portuguesa-6",
        description: "Molho de tomate, muçarela, presunto, cebola, ovos, milho e ervilha.",
        price_cents: 4990, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Frango com Muçarela (6 fatias)",
        slug: "frango-mucarela-6",
        description: "Massa fina, molho de tomate, muçarela, frango desfiado e orégano.",
        price_cents: 4490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Meia Calabresa e Meia Muçarela (6 fatias)",
        slug: "meia-calabresa-meia-mucarela-6",
        description: "Metade calabresa acebolada e metade muçarela com tomate. Duas delícias em uma.",
        price_cents: 4490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Meia Calabresa e Meia Portuguesa (6 fatias)",
        slug: "meia-calabresa-meia-portuguesa-6",
        description: "Massa fina com metade calabresa e metade portuguesa. Para quem não consegue escolher!",
        price_cents: 4990, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Banana Nevada (6 fatias)",
        slug: "banana-nevada-6",
        description: "Pizza doce com banana, chocolate branco, Catupiry Original e canela. Uma sobremesa irresistível!",
        price_cents: 4990, promo_price_cents: null, is_featured: true,
      },
    ],
  },
  {
    category: { name: "Calzone", slug: "calzone", sort_order: 3 },
    products: [
      {
        name: "Calzone de Calabresa",
        slug: "calzone-calabresa",
        description: "Molho de tomate, mussarela, calabresa sem cebola e orégano. Crocante por fora, recheado por dentro.",
        price_cents: 4200, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Calzone de Frango com Mussarela",
        slug: "calzone-frango-mucarela",
        description: "Molho de tomate, mussarela, frango desfiado, mussarela extra e orégano.",
        price_cents: 4190, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Calzone de Mussarela",
        slug: "calzone-mucarela",
        description: "Molho de tomate, mussarela e tomate. Simples e delicioso.",
        price_cents: 4200, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Calzone Portuguesa",
        slug: "calzone-portuguesa",
        description: "Molho de tomate, mussarela, presunto, ovos, cebola, milho e ervilha.",
        price_cents: 4200, promo_price_cents: null, is_featured: false,
      },
    ],
  },
  {
    category: { name: "Combos Promocionais", slug: "combos-promocionais", sort_order: 4 },
    products: [
      {
        name: "Combo Calabresa Acebolada (4 fatias) + Coca Zero 350ml",
        slug: "combo-calabresa-coca-zero",
        description: "Pizza Calabresa Acebolada (4 pedaços) + Coca Zero 350ml. Perfeito para uma refeição individual.",
        price_cents: 3990, promo_price_cents: null, is_featured: true,
      },
      {
        name: "Meia Calabresa c/ Catupiry + Meia Frango c/ Catupiry + Coca Lata",
        slug: "combo-meia-catupiry-coca",
        description: "Pizza média (6 fatias): metade calabresa com Catupiry, metade frango com Catupiry + Coca-Cola lata.",
        price_cents: 6590, promo_price_cents: null, is_featured: true,
      },
      {
        name: "Bauru + Coca-Cola 1 Litro (8 fatias)",
        slug: "combo-bauru-coca-1l",
        description: "Pizza Bauru (massa fina, muçarela, presunto, tomate, orégano) 8 fatias + Coca-Cola 1 litro.",
        price_cents: 6490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Portuguesa + Coca-Cola 1 Litro (8 fatias)",
        slug: "combo-portuguesa-coca-1l",
        description: "Pizza Portuguesa (8 fatias) + Coca-Cola 1 litro. Ideal para compartilhar.",
        price_cents: 7190, promo_price_cents: null, is_featured: false,
      },
    ],
  },
  {
    category: { name: "Bebidas", slug: "bebidas", sort_order: 5 },
    products: [
      {
        name: "Coca-Cola Zero 350ml lata",
        slug: "coca-zero-lata",
        description: "Coca-Cola Zero Açúcar lata 350ml.",
        price_cents: 890, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Coca-Cola Original 350ml lata",
        slug: "coca-original-lata",
        description: "Coca-Cola Original lata 350ml.",
        price_cents: 890, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Guaraná Antarctica 350ml lata",
        slug: "guarana-lata",
        description: "Guaraná Antarctica lata 350ml.",
        price_cents: 850, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Coca-Cola pet 1 Litro",
        slug: "coca-pet-1l",
        description: "Coca-Cola garrafa PET 1 litro.",
        price_cents: 1490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Coca-Cola Zero pet 1 Litro",
        slug: "coca-zero-pet-1l",
        description: "Coca-Cola Zero Açúcar garrafa PET 1 litro.",
        price_cents: 1490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Guaraná Antarctica 2 Litros",
        slug: "guarana-2l",
        description: "Guaraná Antarctica garrafa 2 litros.",
        price_cents: 1790, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Coca-Cola 2 Litros Zero Açúcar",
        slug: "coca-2l-zero",
        description: "Coca-Cola Zero Açúcar garrafa 2 litros.",
        price_cents: 1990, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Suco Del Valle Laranja 450ml",
        slug: "suco-del-valle-laranja",
        description: "Suco Del Valle sabor laranja 450ml.",
        price_cents: 950, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Suco Del Valle Uva 450ml",
        slug: "suco-del-valle-uva",
        description: "Suco Del Valle sabor uva 450ml.",
        price_cents: 950, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Água Mineral 500ml",
        slug: "agua-mineral",
        description: "Água mineral sem gás 500ml.",
        price_cents: 490, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Água com Gás 500ml",
        slug: "agua-com-gas",
        description: "Água mineral com gás 500ml.",
        price_cents: 590, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Red Bull Lata",
        slug: "red-bull",
        description: "Red Bull Energy Drink lata.",
        price_cents: 1590, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Vinho Tinto Suave Quinta do Morgado 750ml",
        slug: "vinho-quinta-morgado",
        description: "Vinho tinto suave Quinta do Morgado 750ml. Harmonização perfeita com pizzas.",
        price_cents: 2990, promo_price_cents: null, is_featured: false,
      },
    ],
  },
  {
    category: { name: "Sobremesas", slug: "sobremesas", sort_order: 6 },
    products: [
      {
        name: "Pote Sorvete Napolitano 2 Litros",
        slug: "sorvete-napolitano-2l",
        description: "Pote de sorvete sabor Napolitano Fika Frio 2 litros.",
        price_cents: 3890, promo_price_cents: null, is_featured: false,
      },
      {
        name: "Pote Sorvete Flocos 2 Litros",
        slug: "sorvete-flocos-2l",
        description: "Pote de sorvete sabor Flocos Fika Frio 2 litros.",
        price_cents: 3890, promo_price_cents: 2723, is_featured: false,
      },
      {
        name: "Pote Sorvete Chocolate 2 Litros",
        slug: "sorvete-chocolate-2l",
        description: "Pote de sorvete sabor Chocolate Fika Frio 2 litros.",
        price_cents: 3890, promo_price_cents: 2723, is_featured: false,
      },
      {
        name: "Pote Sorvete Creme 2 Litros",
        slug: "sorvete-creme-2l",
        description: "Pote de sorvete sabor Creme Fika Frio 2 litros (não contém glúten).",
        price_cents: 3890, promo_price_cents: 2723, is_featured: false,
      },
      {
        name: "Kopão de Flocos Fika Frio",
        slug: "kopao-flocos",
        description: "Kopão de sorvete de flocos Fika Frio.",
        price_cents: 2790, promo_price_cents: null, is_featured: false,
      },
      {
        name: "2 Sundaes Chocolate e Morango",
        slug: "sundae-chocolate-morango",
        description: "Kit com 2 sundaes sabores chocolate e morango.",
        price_cents: 2990, promo_price_cents: 1645, is_featured: true,
      },
      {
        name: "3 Pudins de Ninho com Nutella",
        slug: "pudim-ninho-nutella",
        description: "Trio de pudins artesanais de leite Ninho cobertos com Nutella. Sobremesa irresistível!",
        price_cents: 3690, promo_price_cents: null, is_featured: true,
      },
      {
        name: "3 Pudins Tradicional Leite Condensado",
        slug: "pudim-leite-condensado",
        description: "Trio de pudins tradicionais de leite condensado com calda de caramelo.",
        price_cents: 3590, promo_price_cents: null, is_featured: false,
      },
    ],
  },
];

/* ─── Main ─────────────────────────────────────────────────────────────── */
(async () => {
  const client = new Client({
    host: "aws-1-sa-east-1.pooler.supabase.com",
    port: 5432,
    user: `postgres.${ref}`,
    password: pw,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  await client.connect();
  console.log("✅ Conectado\n");

  // ID do restaurante
  const { rows: [rest] } = await client.query(
    "select id from public.restaurants where slug = 'poit-da-pizza'"
  );
  if (!rest) { console.error("Poit da Pizza não encontrado."); process.exit(2); }
  const rid = rest.id;

  // Atualiza info do restaurante
  await client.query(
    `update public.restaurants set
       name = 'Point da Pizza',
       description = 'A Melhor Pizza do Mundo! Massa fina artesanal, ingredientes selecionados — fatiado, triturado ou inteiro. Entrega para toda Maceió.',
       cuisine = 'Pizzaria'
     where id = $1`,
    [rid]
  );
  console.log("📝 Nome atualizado: Point da Pizza");

  // Remove categorias genéricas inseridas antes
  await client.query(
    "delete from public.categories where restaurant_id = $1", [rid]
  );

  let totalProducts = 0;
  for (const { category, products } of CATALOG) {
    // Cria categoria
    const { rows: [cat] } = await client.query(
      `insert into public.categories
         (restaurant_id, name, slug, sort_order, is_active)
       values ($1,$2,$3,$4,true)
       on conflict (restaurant_id, slug) do update set name=excluded.name
       returning id`,
      [rid, category.name, category.slug, category.sort_order]
    );

    console.log(`\n📂 ${category.name}`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await client.query(
        `insert into public.products
           (restaurant_id, category_id, name, slug, description,
            price_cents, promo_price_cents, is_available, is_featured, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,true,$8,$9)
         on conflict (restaurant_id, slug) do update
           set name=excluded.name, description=excluded.description,
               price_cents=excluded.price_cents,
               promo_price_cents=excluded.promo_price_cents,
               is_featured=excluded.is_featured,
               category_id=excluded.category_id`,
        [rid, cat.id, p.name, p.slug, p.description,
         p.price_cents, p.promo_price_cents, p.is_featured, i + 1]
      );
      const promo = p.promo_price_cents
        ? ` (promo: R$ ${(p.promo_price_cents/100).toFixed(2)})`
        : "";
      console.log(`   ✅ ${p.name.padEnd(50)} R$ ${(p.price_cents/100).toFixed(2)}${promo}`);
      totalProducts++;
    }
  }

  // Atualiza configurações
  await client.query(
    `update public.restaurant_settings set
       delivery_fee_cents = 0,
       min_order_cents = 1500,
       avg_prep_minutes = 30,
       address_city = 'Maceió',
       address_state = 'AL'
     where restaurant_id = $1`,
    [rid]
  );

  console.log(`\n🎉 Point da Pizza: ${totalProducts} produtos cadastrados em ${CATALOG.length} categorias!`);
  console.log("🏙️  Cidade: Maceió/AL | Entrega grátis | Pedido mínimo: R$ 15,00");
  await client.end();
})().catch(e => { console.error("ERRO:", e.message); process.exit(2); });
