/* Remove produtos do seed genérico do Luciani's — mantém só o cardápio real. */
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const KEEP_SLUGS = [
  "lasanha-bolonhesa",
  "lasanha-frango-cremoso",
  "lasanha-camarao",
  "risoto-camarao",
  "risoto-tilapia",
];

const KEEP_CATEGORIES = ["lasanhas", "risotos"];

(async () => {
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("slug", "lucianis-di-qualita")
    .single();

  if (!restaurant) {
    console.error("Luciani's não encontrado.");
    process.exit(2);
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name")
    .eq("restaurant_id", restaurant.id);

  const toRemove = (products ?? []).filter((p) => !KEEP_SLUGS.includes(p.slug));

  if (toRemove.length) {
    const ids = toRemove.map((p) => p.id);
    await supabase.from("products").delete().in("id", ids);
    console.log(`🗑️  ${toRemove.length} produtos removidos:`);
    toRemove.forEach((p) => console.log(`   - ${p.name}`));
  } else {
    console.log("✅ Nenhum produto extra para remover.");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("restaurant_id", restaurant.id);

  const emptyCats = (categories ?? []).filter((c) => !KEEP_CATEGORIES.includes(c.slug));

  if (emptyCats.length) {
    await supabase
      .from("categories")
      .delete()
      .in(
        "id",
        emptyCats.map((c) => c.id)
      );
    console.log(`\n📂 ${emptyCats.length} categorias vazias removidas:`);
    emptyCats.forEach((c) => console.log(`   - ${c.name}`));
  }

  console.log("\n✅ Cardápio Luciani's limpo.");
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(2);
});
