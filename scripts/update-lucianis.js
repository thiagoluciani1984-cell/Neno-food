/**
 * Atualiza o Luciani's com:
 * - Preços e descrições reais extraídos das imagens do cardápio
 * - Logo oficial enviado pelo dono
 * - Upload de imagens de produto para o Storage do Supabase
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { Client } = require("pg");

const ref = process.env.PROJECT_REF || "lelimqdzvwafxzvrkszj";
const pw = process.env.PGPW;
const serviceKey = process.env.SERVICE_KEY; // service_role ignora RLS no Storage
const supabaseUrl = `https://${ref}.supabase.co`;

if (!pw || !serviceKey) {
  console.error("Defina PGPW e SERVICE_KEY.");
  process.exit(1);
}

// ─── Cardápio extraído das imagens ────────────────────────────────────────────
const PRODUCTS = [
  {
    slug: "lasanha-bolonhesa",
    name: "Lasanha Bolonhesa",
    description:
      "Molho bolonhesa preparado lentamente com carne selecionada, massa delicada e muito queijo gratinado. A clássica italiana que conquista no primeiro garfado. Peso: 450g.",
    price_cents: 3500,
    promo_price_cents: null,
    is_featured: true,
  },
  {
    slug: "lasanha-frango-cremoso",
    name: "Lasanha de Frango Cremosa",
    description:
      "Camadas generosas de frango desfiado temperado com ervas naturais, molho bechamel cremoso artesanal feito com leite Ninho e muito queijo gratinado. Sabor suave e irresistível. Peso: 450g.",
    price_cents: 4500,
    promo_price_cents: null,
    is_featured: true,
  },
  {
    slug: "lasanha-camarao",
    name: "Lasanha de Camarão Cremoso",
    description:
      "Camarões selecionados em um molho cremoso artesanal, com toque de ervas e gratinado dourado. Sofisticada, cremosa e irresistível. Peso: 450g.",
    price_cents: 4500,
    promo_price_cents: null,
    is_featured: true,
  },
  {
    slug: "risoto-camarao",
    name: "Risoto de Camarão Cremoso",
    description:
      "Arroz arbóreo cozido lentamente no caldo de frutos do mar artesanal, finalizado com queijo parmesão de verdade, manteiga e camarões selecionados. Cremoso, aromático e simplesmente irresistível. Receita exclusiva Luciani's. Peso: 450g.",
    price_cents: 4500,
    promo_price_cents: null,
    is_featured: true,
  },
  {
    slug: "risoto-tilapia",
    name: "Risoto de Tilápia",
    description:
      "Tilápia grelhada em cubinhos, arroz arbóreo cremoso, ervas frescas e toque de limão siciliano. Leve, sofisticado e cheio de sabor. Peso: 450g.",
    price_cents: 4500,
    promo_price_cents: null,
    is_featured: false,
  },
];

// ─── Mapeamento: slug do produto → arquivo de imagem local ───────────────────
const ASSETS_DIR = path.join(
  "C:\\Users\\Acer\\.cursor\\projects\\c-Users-Acer-OneDrive-rea-de-Trabalho-neno-food",
  "assets"
);

const PRODUCT_IMAGES = {
  "risoto-camarao":
    "c__Users_Acer_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_1000447913__1_-161d43cf-11fa-4330-819e-2d6545df0210.png",
  "lasanha-frango-cremoso":
    "c__Users_Acer_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_1000447881__1_-14cb9ba7-21a8-4008-b82b-b39359aa9690.png",
};

const LOGO_FILE =
  "c__Users_Acer_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_4_de_jun._de_2026__20_01_14-e0b8eacc-6b05-43cb-ba7c-d5efb18ef6cc.png";

// ─── Upload para o Supabase Storage via fetch nativo do Node ─────────────────
async function uploadToStorage(bucket, storagePath, filePath, contentType = "image/png") {
  const fileBuffer = fs.readFileSync(filePath);

  return new Promise((resolve, reject) => {
    const url = new URL(`/storage/v1/object/${bucket}/${storagePath}`, supabaseUrl);
    const options = {
      method: "POST",
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length,
        "x-upsert": "true",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload falhou ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(fileBuffer);
    req.end();
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
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
  console.log("✅ Conectado ao banco\n");

  // ID do restaurante
  const { rows: [restaurant] } = await client.query(
    "select id from public.restaurants where slug = 'lucianis-di-qualita'"
  );
  if (!restaurant) { console.error("Restaurante não encontrado."); process.exit(2); }
  const restaurantId = restaurant.id;
  console.log("Restaurante ID:", restaurantId);

  // 1. Upload do logo
  console.log("\n📸 Fazendo upload do logo...");
  const logoPath = path.join(ASSETS_DIR, LOGO_FILE);
  let logoUrl = null;
  if (fs.existsSync(logoPath)) {
    try {
      logoUrl = await uploadToStorage(
        "restaurant-assets",
        `${restaurantId}/logo.png`,
        logoPath
      );
      console.log("   Logo URL:", logoUrl);
      await client.query(
        "update public.restaurants set logo_url = $1 where id = $2",
        [logoUrl, restaurantId]
      );
      console.log("   ✅ Logo atualizado no banco");
    } catch (e) {
      console.log("   ⚠️  Logo upload falhou:", e.message);
    }
  } else {
    console.log("   ⚠️  Arquivo de logo não encontrado:", logoPath);
  }

  // 2. Atualizar produtos com preços/descrições reais + upload de imagens
  console.log("\n🍽️  Atualizando produtos...");
  for (const p of PRODUCTS) {
    // Upload de imagem do produto (se disponível)
    let imageUrl = null;
    const imgFile = PRODUCT_IMAGES[p.slug];
    if (imgFile) {
      const imgPath = path.join(ASSETS_DIR, imgFile);
      if (fs.existsSync(imgPath)) {
        try {
          imageUrl = await uploadToStorage(
            "product-images",
            `${restaurantId}/${p.slug}.png`,
            imgPath
          );
          console.log(`   📸 Imagem enviada: ${p.name}`);
        } catch (e) {
          console.log(`   ⚠️  Imagem falhou (${p.name}):`, e.message);
        }
      }
    }

    // Atualiza produto no banco
    const imgClause = imageUrl ? ", image_url = $7" : "";
    const params = imageUrl
      ? [p.name, p.description, p.price_cents, p.promo_price_cents, p.is_featured, restaurantId, imageUrl, p.slug]
      : [p.name, p.description, p.price_cents, p.promo_price_cents, p.is_featured, restaurantId, p.slug];
    const slugParam = imageUrl ? "$8" : "$7";

    const updateResult = await client.query(
      `update public.products
       set name              = $1,
           description       = $2,
           price_cents       = $3,
           promo_price_cents = $4,
           is_featured       = $5
           ${imgClause}
       where restaurant_id = $6 and slug = ${slugParam}
       returning name`,
      params
    );

    // Se produto não existe pelo slug antigo, tenta criar
    if (updateResult.rowCount === 0) {
      console.log(`   ⚠️  Produto não encontrado pelo slug (${p.slug}), pulando.`);
    } else {
      console.log(`   ✅ ${p.name} — R$ ${(p.price_cents / 100).toFixed(2)}`);
    }
  }

  // 3. Atualizar configurações: entrega gratuita em Jatiúca (info do flyer)
  await client.query(
    `update public.restaurant_settings
     set delivery_fee_cents = 0,
         free_delivery_above_cents = null,
         avg_prep_minutes = 40,
         address_city = 'Maceió',
         address_state = 'AL'
     where restaurant_id = $1`,
    [restaurantId]
  );
  console.log("\n✅ Configurações atualizadas (entrega, cidade: Maceió/AL)");

  // 4. Resumo final
  const { rows: products } = await client.query(
    "select name, price_cents from public.products where restaurant_id = $1 and deleted_at is null order by sort_order",
    [restaurantId]
  );
  console.log("\n📋 Cardápio atual do Luciani's:");
  products.forEach((p) => console.log(`   ${p.name.padEnd(35)} R$ ${(p.price_cents / 100).toFixed(2)}`));

  await client.end();
  console.log("\n🎉 Tudo atualizado com sucesso!");
})().catch((e) => { console.error("ERRO:", e.message); process.exit(2); });
