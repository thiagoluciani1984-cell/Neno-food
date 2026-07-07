/* Aplica supabase/full_setup.sql no banco remoto do Supabase.
   Gere antes: npm run db:build
   A senha vem da variável de ambiente PGPW (não fica salva no arquivo).
   Para bancos existentes, prefira: npm run db:apply */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const ref = process.env.PROJECT_REF || "lelimqdzvwafxzvrkszj";
const password = process.env.PGPW;
if (!password) {
  console.error("Defina PGPW com a senha do banco.");
  process.exit(1);
}

const sqlPath = path.join(__dirname, "..", "supabase", "full_setup.sql");
// remove BOM (e quaisquer marcas U+FEFF) que quebram o parser do Postgres
const sql = fs.readFileSync(sqlPath, "utf8").replace(/\uFEFF/g, "");

const candidates = [
  { host: "aws-1-sa-east-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { host: "aws-0-sa-east-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" },
];

(async () => {
  for (const c of candidates) {
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
      process.stdout.write(`Tentando ${c.host} (user ${c.user})... `);
      await client.connect();
      console.log("CONECTADO");
      await client.query(sql);
      console.log("\n✅ SCHEMA + SEED APLICADOS COM SUCESSO");
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log("falhou:", e.message);
      try {
        await client.end();
      } catch {}
    }
  }
  console.error("\n❌ Não foi possível conectar/aplicar em nenhum host.");
  process.exit(2);
})();
