/* Remove os dados de seed corrompidos e reaplica o seed.sql com UTF-8 correto. */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const ref = process.env.PROJECT_REF || "lelimqdzvwafxzvrkszj";
const password = process.env.PGPW;
if (!password) {
  console.error("Defina PGPW.");
  process.exit(1);
}

const seed = fs
  .readFileSync(path.join(__dirname, "..", "supabase", "seed.sql"), "utf8")
  .replace(/\uFEFF/g, "");

(async () => {
  const client = new Client({
    host: "aws-1-sa-east-1.pooler.supabase.com",
    port: 5432,
    user: `postgres.${ref}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    client_encoding: "UTF8",
  });

  await client.connect();
  console.log("Conectado. Limpando seed antigo...");
  // Apagar o restaurante remove em cascata categorias, produtos, settings e cupons
  await client.query(
    "delete from public.restaurants where slug = 'lucianis-di-qualita'"
  );
  console.log("Reaplicando seed correto...");
  await client.query(seed);
  console.log("✅ Seed reaplicado com encoding correto.");

  const { rows } = await client.query(
    "select name from public.products order by created_at limit 5"
  );
  console.log("Amostra:", rows.map((r) => r.name).join(" | "));
  await client.end();
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(2);
});
