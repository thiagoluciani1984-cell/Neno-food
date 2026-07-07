/* Verifica conexão com a API Pagar.me. */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").replace(/\r/g, "").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const key = process.env.PAGARME_SECRET_KEY?.trim();
const devMock = process.env.PAGARME_DEV_MOCK === "true";

if (!key) {
  if (devMock) {
    console.log("⚠️  PAGARME_SECRET_KEY ausente, mas PAGARME_DEV_MOCK=true");
    console.log("   PIX online funcionará em modo simulado (dev).");
    process.exit(0);
  }
  console.error("❌ PAGARME_SECRET_KEY não definida.");
  console.error("   Adicione em .env.local ou ative PAGARME_DEV_MOCK=true para testes.");
  process.exit(1);
}

const isTest = key.includes("_test_");
const auth = Buffer.from(`${key}:`).toString("base64");

(async () => {
  const res = await fetch("https://api.pagar.me/core/v5/recipients?size=1", {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Pagar.me respondeu ${res.status}:`, body.slice(0, 200));
    process.exit(2);
  }

  console.log(`✅ Pagar.me conectado (${isTest ? "sandbox" : "produção"})`);

  if (process.env.PAGARME_PLATFORM_RECIPIENT_ID) {
    console.log(`   Split plataforma: ${process.env.PAGARME_PLATFORM_RECIPIENT_ID}`);
  } else {
    console.log("   Split plataforma: não configurado (opcional)");
  }

  console.log(`\n📡 Webhook URL: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/payments/pagarme/webhook`);
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(3);
});
