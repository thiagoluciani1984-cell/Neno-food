/**
 * Popula a biblioteca Nenos Studio com imagens gastronômicas de exemplo.
 * Uso: node scripts/seed-nenos-studio.js
 * Requer: SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL em .env.local
 */
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SAMPLES = [
  {
    category: "pizza",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    tags: ["pizza", "italiana", "queijo"],
  },
  {
    category: "burger",
    url: "https://images.unsplash.com/photo-1568901349315-1c2c945d736a?w=800&q=80",
    tags: ["burger", "lanche", "carne"],
  },
  {
    category: "drinks",
    url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
    tags: ["bebida", "refrigerante", "copo"],
  },
  {
    category: "desserts",
    url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
    tags: ["sobremesa", "doce", "chocolate"],
  },
  {
    category: "italian",
    url: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
    tags: ["massa", "italiana", "prato"],
  },
  {
    category: "vegetarian",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    tags: ["salada", "vegetariano", "saudável"],
  },
  {
    category: "sushi",
    url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80",
    tags: ["sushi", "japonês", "peixe"],
  },
  {
    category: "pizza",
    url: "https://images.unsplash.com/photo-1604382894930-1496d4b2b4a0?w=800&q=80",
    tags: ["pizza", "calabresa", "forno"],
  },
];

async function main() {
  const { count } = await supabase
    .from("image_library")
    .select("id", { count: "exact", head: true })
    .eq("source", "nenos_studio");

  if ((count ?? 0) > 0) {
    console.log(`ℹ️  Biblioteca já tem ${count} imagens nenos_studio — pulando seed.`);
    return;
  }

  const rows = SAMPLES.map((item) => ({
    restaurant_id: null,
    url: item.url,
    thumbnail_url: item.url,
    source: "nenos_studio",
    category: item.category,
    tags: item.tags,
    is_approved: true,
  }));

  const { error } = await supabase.from("image_library").insert(rows);
  if (error) {
    console.error("Erro ao inserir imagens:", error.message);
    process.exit(1);
  }

  console.log(`✅ ${rows.length} imagens adicionadas à Biblioteca Nenos Studio.`);
}

main();
