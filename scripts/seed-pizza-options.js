/* Adiciona opções de Borda e Adicionais às pizzas do Point da Pizza. */
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

const OPTION_GROUPS = [
  {
    name: "Borda",
    type: "single",
    is_required: true,
    min_qty: 1,
    max_qty: 1,
    sort_order: 1,
    items: [
      { name: "Tradicional", price_cents: 0, sort_order: 1 },
      { name: "Catupiry Original", price_cents: 500, sort_order: 2 },
      { name: "Cheddar", price_cents: 500, sort_order: 3 },
    ],
  },
  {
    name: "Adicionais",
    type: "multiple",
    is_required: false,
    min_qty: 0,
    max_qty: 5,
    sort_order: 2,
    items: [
      { name: "Bacon", price_cents: 400, sort_order: 1 },
      { name: "Mussarela extra", price_cents: 300, sort_order: 2 },
      { name: "Calabresa", price_cents: 400, sort_order: 3 },
    ],
  },
];

(async () => {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("slug", "poit-da-pizza")
    .single();

  if (restaurantError || !restaurant) {
    console.error("Restaurante poit-da-pizza não encontrado.");
    process.exit(2);
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("restaurant_id", restaurant.id)
    .like("slug", "pizza%");

  if (categoriesError) throw categoriesError;

  const categoryIds = (categories ?? []).map((c) => c.id);
  if (!categoryIds.length) {
    console.error("Nenhuma categoria de pizza encontrada.");
    process.exit(2);
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, slug")
    .in("category_id", categoryIds)
    .eq("is_available", true);

  if (productsError) throw productsError;
  if (!products?.length) {
    console.error("Nenhum produto de pizza encontrado.");
    process.exit(2);
  }

  let configured = 0;

  for (const product of products) {
    const { count } = await supabase
      .from("product_options")
      .select("id", { count: "exact", head: true })
      .eq("product_id", product.id);

    if ((count ?? 0) > 0) {
      console.log(`⏭️  ${product.name} — opções já existem`);
      continue;
    }

    for (const group of OPTION_GROUPS) {
      const { data: createdGroup, error: groupError } = await supabase
        .from("product_options")
        .insert({
          product_id: product.id,
          name: group.name,
          type: group.type,
          is_required: group.is_required,
          min_qty: group.min_qty,
          max_qty: group.max_qty,
          sort_order: group.sort_order,
        })
        .select("id")
        .single();

      if (groupError) throw groupError;

      const { error: itemsError } = await supabase.from("product_option_items").insert(
        group.items.map((item) => ({
          option_id: createdGroup.id,
          name: item.name,
          price_cents: item.price_cents,
          sort_order: item.sort_order,
          is_available: true,
        }))
      );

      if (itemsError) throw itemsError;
    }

    configured++;
    console.log(`✅ ${product.name}`);
  }

  console.log(`\n🍕 ${configured} pizzas configuradas com Borda + Adicionais.`);
})().catch((err) => {
  console.error("ERRO:", err.message ?? err);
  if (String(err.message ?? err).includes("product_options")) {
    console.error(
      "\nAs tabelas de opções ainda não existem. Rode supabase/migrations/0016_catalog_extended.sql no SQL Editor."
    );
  }
  process.exit(2);
});
