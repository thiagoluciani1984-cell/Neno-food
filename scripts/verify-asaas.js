/* Verifica conexão com a API Asaas. */
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

const key = process.env.ASAAS_API_KEY?.trim();
const devMock = process.env.ASAAS_DEV_MOCK === "true";
const sandbox = process.env.ASAAS_SANDBOX === "true";

if (!key) {
  if (devMock) {
    console.log("⚠️  ASAAS_API_KEY ausente, mas ASAAS_DEV_MOCK=true");
    console.log("   PIX online funcionará em modo simulado (dev).");
    process.exit(0);
  }
  console.error("❌ ASAAS_API_KEY não definida.");
  console.error("   Adicione em .env.local ou ative ASAAS_DEV_MOCK=true para testes.");
  process.exit(1);
}

const base = sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";

(async () => {
  const res = await fetch(`${base}/myAccount`, {
    headers: { access_token: key },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Asaas respondeu ${res.status}:`, body.slice(0, 200));
    process.exit(2);
  }

  const account = await res.json();
  console.log(`✅ Asaas conectado (${sandbox ? "sandbox" : "produção"}) — ${account.name ?? account.email ?? account.id}`);

  if (process.env.ASAAS_PLATFORM_FEE_PERCENT) {
    console.log(`   Taxa da plataforma: ${process.env.ASAAS_PLATFORM_FEE_PERCENT}%`);
  } else {
    console.log("   Taxa da plataforma: não configurada (padrão: 10%)");
  }

  console.log(`\n📡 Webhook URL: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/payments/asaas/webhook`);
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(3);
});
