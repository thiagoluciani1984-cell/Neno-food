/**
 * Gera supabase/full_setup.sql concatenando migrations/0001–0022 + seed.sql.
 * Uso: npm run db:build
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");
const seedPath = path.join(root, "supabase", "seed.sql");
const outPath = path.join(root, "supabase", "full_setup.sql");

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const header = `-- =====================================================================
-- Nenos Food — full_setup.sql (GERADO AUTOMATICAMENTE)
-- =====================================================================
-- NÃO edite este arquivo manualmente.
-- Para regenerar: npm run db:build
--
-- Conteúdo: ${migrationFiles.length} migrations (0001–0022) + seed.sql
-- Gerado em: ${new Date().toISOString()}
-- =====================================================================

`;

let sql = header;

for (const file of migrationFiles) {
  const content = fs.readFileSync(path.join(migrationsDir, file), "utf8").replace(/\uFEFF/g, "");
  sql += `\n-- ─── ${file} ─────────────────────────────────────────────────────────\n\n`;
  sql += content.trimEnd();
  sql += "\n\n";
}

if (fs.existsSync(seedPath)) {
  const seed = fs.readFileSync(seedPath, "utf8").replace(/\uFEFF/g, "");
  sql += `\n-- ─── seed.sql ───────────────────────────────────────────────────────────\n\n`;
  sql += seed.trimEnd();
  sql += "\n";
}

fs.writeFileSync(outPath, sql, "utf8");
console.log(`✅ full_setup.sql gerado (${migrationFiles.length} migrations + seed)`);
console.log(`   ${outPath}`);
