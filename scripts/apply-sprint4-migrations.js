/* @deprecated Use npm run db:apply (scripts/apply-migrations.js) */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const ref = process.env.PROJECT_REF || "lelimqdzvwafxzvrkszj";
const pw = process.env.PGPW;

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").replace(/\r/g, "").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

if (!pw && !process.env.PGPW) {
  console.error("Defina PGPW (senha do banco Supabase) para aplicar SQL.");
  process.exit(1);
}

const password = pw || process.env.PGPW;

const SQL_FILES = [
  path.join(__dirname, "..", "supabase", "sprint1_product_options.sql"),
  path.join(__dirname, "..", "supabase", "migrations", "0022_pagarme.sql"),
];

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
  throw new Error("Não foi possível conectar.");
}

(async () => {
  const client = await connectClient();
  for (const file of SQL_FILES) {
    const sql = fs.readFileSync(file, "utf8").replace(/\uFEFF/g, "");
    console.log(`\n📄 Aplicando ${path.basename(file)}...`);
    await client.query(sql);
    console.log("   ✅ OK");
  }
  await client.end();
  console.log("\n🎉 Migrations Sprint 4 aplicadas.");
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(2);
});
