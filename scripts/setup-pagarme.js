/**
 * Configuração assistida do Pagar.me.
 *
 * Uso:
 *   npm run pagarme:setup
 *   npm run pagarme:setup -- --list-recipients
 *   npm run pagarme:setup -- --set-recipient lucianis-di-qualita rp_xxxxxxxx
 *   npm run pagarme:setup -- --set-platform rp_xxxxxxxx
 *   npm run pagarme:setup -- --webhook-auth
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");

function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf8").replace(/\r/g, "").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

function upsertEnvVar(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");

  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    content = content.trimEnd() + `\n${line}\n`;
  }

  fs.writeFileSync(ENV_PATH, content, "utf8");
  process.env[key] = value;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list-recipients") args.listRecipients = true;
    else if (a === "--set-recipient") {
      args.setRecipient = { slug: argv[++i], id: argv[++i] };
    } else if (a === "--set-platform") {
      args.setPlatform = argv[++i];
    } else if (a === "--webhook-auth") args.webhookAuth = true;
    else if (a === "--key") args.key = argv[++i];
    else if (!a.startsWith("--")) args._.push(a);
  }
  return args;
}

async function pagarmeGet(pathname, key) {
  const auth = Buffer.from(`${key}:`).toString("base64");
  const res = await fetch(`https://api.pagar.me/core/v5${pathname}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message ?? body?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  return body;
}

async function listRecipients(key) {
  const data = await pagarmeGet("/recipients?size=30", key);
  const items = data.data ?? [];
  if (items.length === 0) {
    console.log("Nenhum recebedor encontrado na conta.");
    console.log("Crie em dashboard.pagar.me → Recebedores.");
    return;
  }

  console.log(`\nRecebedores (${items.length}):\n`);
  for (const r of items) {
    console.log(`  ${r.id}  ${r.status?.padEnd(14) ?? ""}  ${r.name ?? r.email ?? "—"}`);
  }
}

async function setRestaurantRecipient(slug, recipientId) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários.");
  }

  const supabase = createClient(url, serviceKey);
  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (rErr || !restaurant) {
    throw new Error(`Restaurante "${slug}" não encontrado.`);
  }

  const { error } = await supabase
    .from("restaurant_settings")
    .update({ pagarme_recipient_id: recipientId })
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);

  console.log(`✅ ${restaurant.name} (${slug}) → ${recipientId}`);
}

async function main() {
  loadEnvFile();
  const args = parseArgs(process.argv.slice(2));

  if (args.key) {
    upsertEnvVar("PAGARME_SECRET_KEY", args.key);
    console.log("PAGARME_SECRET_KEY salva em .env.local");
  }

  const key = process.env.PAGARME_SECRET_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/payments/pagarme/webhook`;

  if (args.webhookAuth) {
    const user = `nenos_${crypto.randomBytes(4).toString("hex")}`;
    const pass = crypto.randomBytes(16).toString("base64url");
    upsertEnvVar("PAGARME_WEBHOOK_USER", user);
    upsertEnvVar("PAGARME_WEBHOOK_PASSWORD", pass);
    console.log("✅ Credenciais de webhook geradas em .env.local:");
    console.log(`   PAGARME_WEBHOOK_USER=${user}`);
    console.log(`   PAGARME_WEBHOOK_PASSWORD=${pass}`);
    console.log(`\nConfigure no Pagar.me → Webhooks → ${webhookUrl}`);
    console.log("   Autenticação: Basic Auth com os valores acima.");
    console.log("   Eventos: order.paid, charge.paid, order.payment_failed, charge.payment_failed");
    return;
  }

  if (args.setPlatform) {
    upsertEnvVar("PAGARME_PLATFORM_RECIPIENT_ID", args.setPlatform);
    console.log(`✅ PAGARME_PLATFORM_RECIPIENT_ID=${args.setPlatform}`);
  }

  if (args.setRecipient) {
    if (!args.setRecipient.slug || !args.setRecipient.id) {
      console.error("Uso: --set-recipient <slug> <rp_id>");
      process.exit(1);
    }
    await setRestaurantRecipient(args.setRecipient.slug, args.setRecipient.id);
  }

  if (!key || key.includes("xxxxxxxx")) {
    console.log("Pagar.me — configuração pendente\n");
    console.log("1. Acesse https://dashboard.pagar.me → Configurações → Chaves de API");
    console.log("2. Copie a chave sk_test_... (sandbox) ou sk_live_... (produção)");
    console.log("3. Execute:");
    console.log('   npm run pagarme:setup -- --key "sk_test_SUA_CHAVE"');
    console.log("\nOu adicione manualmente em .env.local:");
    console.log("   PAGARME_SECRET_KEY=sk_test_...");
    console.log("\nCom a chave configurada, o modo mock é ignorado automaticamente.");
    process.exit(key ? 0 : 1);
  }

  const isTest = key.includes("_test_");
  try {
    await pagarmeGet("/recipients?size=1", key);
  } catch (e) {
    console.error("❌ Falha ao conectar:", e.message);
    process.exit(2);
  }

  console.log(`✅ Pagar.me conectado (${isTest ? "sandbox / teste" : "produção"})`);
  console.log(`   Webhook: ${webhookUrl}`);

  if (process.env.PAGARME_PLATFORM_RECIPIENT_ID) {
    console.log(`   Split plataforma: ${process.env.PAGARME_PLATFORM_RECIPIENT_ID} (${process.env.PAGARME_PLATFORM_FEE_PERCENT ?? "10"}%)`);
  } else {
    console.log("   Split plataforma: não configurado (pagamentos vão 100% para a conta principal)");
  }

  if (process.env.PAGARME_DEV_MOCK === "true") {
    console.log("\n⚠️  PAGARME_DEV_MOCK=true — pode remover; com chave real o mock já está inativo.");
  }

  if (!process.env.PAGARME_WEBHOOK_USER) {
    console.log("\n💡 Gere credenciais de webhook: npm run pagarme:setup -- --webhook-auth");
  }

  if (args.listRecipients || args.setRecipient || args.setPlatform) {
    await listRecipients(key);
  } else {
    console.log("\nPróximos passos:");
    console.log("  npm run pagarme:setup -- --list-recipients");
    console.log("  npm run pagarme:setup -- --set-platform rp_xxx");
    console.log("  npm run pagarme:setup -- --set-recipient lucianis-di-qualita rp_xxx");
    console.log("  npm run pagarme:setup -- --webhook-auth");
  }
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(3);
});
