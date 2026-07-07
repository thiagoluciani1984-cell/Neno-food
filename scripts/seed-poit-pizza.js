/* Popula o cardápio completo do Poit da Pizza extraído das imagens do iFood. */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").replace(/\r/g, "").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const RESTAURANT_SLUG = "poit-da-pizza";

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

async function ensureRestaurant() {
  const { data: existing, error: findError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", RESTAURANT_SLUG)
    .maybeSingle();

  if (findError) throw findError;
  if (existing?.id) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("restaurants")
    .upsert(
      {
        name: "Poit da Pizza",
        slug: RESTAURANT_SLUG,
        description:
          "As melhores pizzas artesanais da região. Massa fina, ingredientes frescos e muito sabor.",
        cuisine: "Pizzaria",
        status: "active",
        phone: "(11) 90000-0001",
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (createError) throw createError;

  const { error: settingsError } = await supabase.from("restaurant_settings").upsert(
    {
      restaurant_id: created.id,
      is_open: true,
      delivery_fee_cents: 599,
      free_delivery_above_cents: 8000,
      min_order_cents: 2500,
      avg_prep_minutes: 35,
      opening_hours: {
        "0": { open: "18:00", close: "23:00", enabled: true },
        "1": { open: "18:00", close: "23:00", enabled: true },
        "2": { open: "18:00", close: "23:00", enabled: true },
        "3": { open: "18:00", close: "23:00", enabled: true },
        "4": { open: "18:00", close: "23:00", enabled: true },
        "5": { open: "18:00", close: "00:00", enabled: true },
        "6": { open: "18:00", close: "00:00", enabled: true },
      },
      payment_methods: ["pix", "cash", "card"],
      address_city: "Maceió",
      address_state: "AL",
    },
    { onConflict: "restaurant_id" }
  );

  if (settingsError) throw settingsError;
  console.log("🏪 Restaurante criado: Poit da Pizza");
  return created.id;
}

/* ─── Main ─────────────────────────────────────────────────────────────── */
(async () => {
  console.log("🔌 Conectando via Supabase API...\n");
  const rid = await ensureRestaurant();

  const { error: restaurantError } = await supabase
    .from("restaurants")
    .update({
      name: "Point da Pizza",
      description:
        "A Melhor Pizza do Mundo! Massa fina artesanal, ingredientes selecionados — fatiado, triturado ou inteiro. Entrega para toda Maceió.",
      cuisine: "Pizzaria",
    })
    .eq("id", rid);

  if (restaurantError) throw restaurantError;
  console.log("📝 Nome atualizado: Point da Pizza");

  const { error: deleteProductsError } = await supabase
    .from("products")
    .delete()
    .eq("restaurant_id", rid);
  if (deleteProductsError) throw deleteProductsError;

  const { error: deleteCategoriesError } = await supabase
    .from("categories")
    .delete()
    .eq("restaurant_id", rid);
  if (deleteCategoriesError) throw deleteCategoriesError;

  let totalProducts = 0;
  for (const { category, products } of CATALOG) {
    const { data: cat, error: categoryError } = await supabase
      .from("categories")
      .upsert(
        {
          restaurant_id: rid,
          name: category.name,
          slug: category.slug,
          sort_order: category.sort_order,
          is_active: true,
        },
        { onConflict: "restaurant_id,slug" }
      )
      .select("id")
      .single();

    if (categoryError) throw categoryError;
    console.log(`\n📂 ${category.name}`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const { error: productError } = await supabase.from("products").upsert(
        {
          restaurant_id: rid,
          category_id: cat.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price_cents: p.price_cents,
          promo_price_cents: p.promo_price_cents,
          is_available: true,
          is_featured: p.is_featured,
          sort_order: i + 1,
        },
        { onConflict: "restaurant_id,slug" }
      );

      if (productError) throw productError;

      const promo = p.promo_price_cents
        ? ` (promo: R$ ${(p.promo_price_cents / 100).toFixed(2)})`
        : "";
      console.log(
        `   ✅ ${p.name.padEnd(50)} R$ ${(p.price_cents / 100).toFixed(2)}${promo}`
      );
      totalProducts++;
    }
  }

  const { error: settingsError } = await supabase
    .from("restaurant_settings")
    .update({
      delivery_fee_cents: 0,
      min_order_cents: 1500,
      avg_prep_minutes: 30,
      address_city: "Maceió",
      address_state: "AL",
    })
    .eq("restaurant_id", rid);

  if (settingsError) throw settingsError;

  console.log(
    `\n🎉 Point da Pizza: ${totalProducts} produtos cadastrados em ${CATALOG.length} categorias!`
  );
  console.log("🏙️  Cidade: Maceió/AL | Entrega grátis | Pedido mínimo: R$ 15,00");
})().catch((e) => {
  console.error("ERRO:", e.message ?? e);
  process.exit(2);
});
