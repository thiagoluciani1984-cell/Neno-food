/**
 * Aplica todas as migrations em supabase/migrations/ em ordem (0001–0022).
 * Idempotente: migrations usam IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 *
 * Uso: PGPW=senha npm run db:apply
 * Opcional: PROJECT_REF=seu-ref (padrão: lelimqdzvwafxzvrkszj)
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const ref = process.env.PROJECT_REF || "lelimqdzvwafxzvrkszj";

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").replace(/\r/g, "").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const password = process.env.PGPW;
if (!password) {
  console.error("Defina PGPW (senha do banco Supabase).");
  process.exit(1);
}

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const DB_CANDIDATES = [
  { host: "aws-1-sa-east-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { host: "aws-0-sa-east-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" },
];

async function connectClient() {
  for (const c of DB_CANDIDATES) {
    const client = new Client({
      host: c.host,
      port: c.port,
      user: c.user,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    });
    try {
      process.stdout.write(`Tentando ${c.host}... `);
      await client.connect();
      console.log("OK");
      return client;
    } catch (e) {
      console.log("falhou:", e.message);
      try {
        await client.end();
      } catch {}
    }
  }
  throw new Error("Não foi possível conectar ao banco.");
}

(async () => {
  const client = await connectClient();
  console.log(`\n📦 Aplicando ${files.length} migrations...\n`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8").replace(/\uFEFF/g, "");
    process.stdout.write(`   ${file}... `);
    try {
      await client.query(sql);
      console.log("✅");
    } catch (e) {
      console.log("❌");
      console.error(`\nErro em ${file}:`, e.message);
      await client.end();
      process.exit(2);
    }
  }

  await client.end();
  console.log("\n🎉 Todas as migrations aplicadas.");
  console.log("   Rode os seeds: node scripts/seed-poit-pizza.js (opcional)");
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(2);
});
