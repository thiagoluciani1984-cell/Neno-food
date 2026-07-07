/* Atribui imagens Unsplash por categoria aos produtos do Point da Pizza. */
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

const IMAGES_BY_CATEGORY = {
  "pizza-individual":
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
  "pizza-media":
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
  calzone:
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
  "combos-promocionais":
    "https://images.unsplash.com/photo-1594007658522-036b5172a4a6?w=600&q=80",
  bebidas:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
  sobremesas:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80",
};

const DEFAULT_PIZZA =
  "https://images.unsplash.com/photo-1604386346840-dept377e3e4f?w=600&q=80";

(async () => {
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", "poit-da-pizza")
    .single();

  if (!restaurant) {
    console.error("Point da Pizza não encontrado.");
    process.exit(2);
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("restaurant_id", restaurant.id);

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.slug]));

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, category_id, image_url")
    .eq("restaurant_id", restaurant.id);

  let updated = 0;

  for (const product of products ?? []) {
    if (product.image_url) continue;

    const catSlug = catMap.get(product.category_id) ?? "";
    const imageUrl =
      IMAGES_BY_CATEGORY[catSlug] ??
      (catSlug.includes("pizza") ? DEFAULT_PIZZA : IMAGES_BY_CATEGORY.bebidas);

    const { error } = await supabase
      .from("products")
      .update({ image_url: imageUrl })
      .eq("id", product.id);

    if (!error) {
      updated++;
      console.log(`✅ ${product.name}`);
    }
  }

  console.log(`\n🖼️  ${updated} imagens atribuídas ao Point da Pizza.`);
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(2);
});
