/**
 * Configuração assistida da Asaas.
 *
 * Uso:
 *   npm run asaas:setup
 *   npm run asaas:setup -- --key "$aact_..."
 *   npm run asaas:setup -- --set-wallet lucianis-di-qualita 00000000-0000-0000-0000-000000000000
 *   npm run asaas:setup -- --webhook-token
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
    if (a === "--set-wallet") {
      args.setWallet = { slug: argv[++i], id: argv[++i] };
    } else if (a === "--webhook-token") args.webhookToken = true;
    else if (a === "--key") args.key = argv[++i];
    else if (!a.startsWith("--")) args._.push(a);
  }
  return args;
}

async function asaasGet(pathname, key, sandbox) {
  const base = sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
  const res = await fetch(`${base}${pathname}`, {
    headers: { access_token: key },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.errors?.[0]?.description ?? body?.message ?? `HTTP ${res.status}`);
  }
  return body;
}

async function setRestaurantWallet(slug, walletId) {
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
    .update({ asaas_wallet_id: walletId })
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);

  console.log(`✅ ${restaurant.name} (${slug}) → ${walletId}`);
}

async function main() {
  loadEnvFile();
  const args = parseArgs(process.argv.slice(2));

  if (args.key) {
    upsertEnvVar("ASAAS_API_KEY", args.key);
    console.log("ASAAS_API_KEY salva em .env.local");
  }

  const key = process.env.ASAAS_API_KEY?.trim();
  const sandbox = process.env.ASAAS_SANDBOX === "true";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/payments/asaas/webhook`;

  if (args.webhookToken) {
    const token = crypto.randomBytes(24).toString("base64url");
    upsertEnvVar("ASAAS_WEBHOOK_TOKEN", token);
    console.log("✅ Token de webhook gerado em .env.local:");
    console.log(`   ASAAS_WEBHOOK_TOKEN=${token}`);
    console.log(`\nConfigure no painel Asaas → Integrações → Webhooks → ${webhookUrl}`);
    console.log(`   Header de autenticação (asaas-access-token): ${token}`);
    console.log("   Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_DELETED, PAYMENT_REFUNDED");
    return;
  }

  if (args.setWallet) {
    if (!args.setWallet.slug || !args.setWallet.id) {
      console.error("Uso: --set-wallet <slug> <walletId>");
      process.exit(1);
    }
    await setRestaurantWallet(args.setWallet.slug, args.setWallet.id);
  }

  if (!key) {
    console.log("Asaas — configuração pendente\n");
    console.log("1. Acesse https://sandbox.asaas.com (testes) ou https://www.asaas.com (produção)");
    console.log("2. Copie a chave em Configurações → Integração → Chave de API");
    console.log("3. Execute:");
    console.log('   npm run asaas:setup -- --key "$aact_..."');
    console.log("\nOu adicione manualmente em .env.local:");
    console.log("   ASAAS_API_KEY=$aact_...");
    console.log("\nCom a chave configurada, o modo mock é ignorado automaticamente.");
    process.exit(1);
  }

  try {
    const account = await asaasGet("/myAccount", key, sandbox);
    console.log(`✅ Asaas conectado (${sandbox ? "sandbox" : "produção"}) — ${account.name ?? account.email ?? account.id}`);
  } catch (e) {
    console.error("❌ Falha ao conectar:", e.message);
    process.exit(2);
  }

  console.log(`   Webhook: ${webhookUrl}`);

  if (process.env.ASAAS_PLATFORM_FEE_PERCENT) {
    console.log(`   Taxa da plataforma: ${process.env.ASAAS_PLATFORM_FEE_PERCENT}%`);
  } else {
    console.log("   Taxa da plataforma: não configurada (padrão: 10%)");
  }

  if (process.env.ASAAS_DEV_MOCK === "true") {
    console.log("\n⚠️  ASAAS_DEV_MOCK=true — pode remover; com chave real o mock já está inativo.");
  }

  if (!process.env.ASAAS_WEBHOOK_TOKEN) {
    console.log("\n💡 Gere o token de webhook: npm run asaas:setup -- --webhook-token");
  }

  if (!args.setWallet) {
    console.log("\nPróximos passos:");
    console.log("  npm run asaas:setup -- --set-wallet lucianis-di-qualita <walletId>");
    console.log("  npm run asaas:setup -- --webhook-token");
  }
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(3);
});
