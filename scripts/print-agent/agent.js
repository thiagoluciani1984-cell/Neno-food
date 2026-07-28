/**
 * Agente local de impressão — roda no computador do restaurante (Windows),
 * observa pedidos novos no Supabase e manda o cupom pra impressora térmica
 * usando o driver/spooler do Windows (o mesmo caminho que a página de teste
 * de impressora do Windows usa — não depende de porta serial/Web Serial).
 *
 * Configuração: copie .env.example para .env e preencha os valores.
 * Uso:
 *   node agent.js           inicia o monitoramento contínuo
 *   node agent.js --test    imprime um cupom de teste e sai
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { createClient } = require("@supabase/supabase-js");
const { buildOrderReceipt } = require("./print-receipt");
const { ReceiptBuilder } = require("./escpos");

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Arquivo .env não encontrado. Copie .env.example para .env e preencha.");
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, "utf8").replace(/\r/g, "");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const REQUIRED = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "RESTAURANT_EMAIL", "RESTAURANT_PASSWORD", "PRINTER_SHARE_NAME"];
for (const key of REQUIRED) {
  if (!env[key]) {
    console.error(`Falta configurar ${key} no arquivo .env`);
    process.exit(1);
  }
}

const POLL_INTERVAL_MS = 8000;
const STATE_FILE = path.join(__dirname, "state.json");

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { lastCheckedAt: new Date().toISOString() };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function log(msg) {
  console.log(`[${new Date().toLocaleString("pt-BR")}] ${msg}`);
}

/** Manda bytes crus pro spooler do Windows via cópia binária pro compartilhamento da impressora. */
function printRaw(bytes) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `nenos-print-${Date.now()}.prn`);
    fs.writeFileSync(tempFile, bytes);
    const target = `\\\\${os.hostname()}\\${env.PRINTER_SHARE_NAME}`;
    execFile("cmd.exe", ["/c", "copy", "/b", tempFile, target], (error, stdout, stderr) => {
      fs.unlink(tempFile, () => {});
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve();
      }
    });
  });
}

async function testPrint() {
  log("Enviando cupom de teste...");
  const receipt = new ReceiptBuilder()
    .init()
    .align("center")
    .bold(true)
    .text("Teste do agente de impressao")
    .bold(false)
    .text("Nenos Food")
    .cut()
    .build();
  await printRaw(receipt);
  log("Cupom de teste enviado. Se não sair nada, revise PRINTER_SHARE_NAME no .env e se a impressora está compartilhada no Windows.");
}

async function main() {
  if (process.argv.includes("--test")) {
    await testPrint();
    return;
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  log("Entrando com a conta do restaurante...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: env.RESTAURANT_EMAIL,
    password: env.RESTAURANT_PASSWORD,
  });
  if (authError) {
    console.error("Falha no login:", authError.message);
    process.exit(1);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("restaurant_id, full_name")
    .eq("id", authData.user.id)
    .single();
  if (profileError || !profile?.restaurant_id) {
    console.error("Não foi possível identificar o restaurante desta conta.", profileError?.message);
    process.exit(1);
  }

  log(`Conectado como ${profile.full_name}. Monitorando pedidos novos...`);

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", profile.restaurant_id)
    .single();
  const restaurantName = restaurant?.name ?? "Nenos Food";

  const state = loadState();

  async function checkNewOrders() {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_options(*))")
      .eq("restaurant_id", profile.restaurant_id)
      .gt("created_at", state.lastCheckedAt)
      .order("created_at", { ascending: true });

    if (error) {
      log(`Erro ao buscar pedidos: ${error.message}`);
      return;
    }
    if (!orders || orders.length === 0) return;

    for (const order of orders) {
      try {
        log(`Novo pedido #${order.order_number} — imprimindo...`);
        const receipt = buildOrderReceipt(order, restaurantName);
        await printRaw(receipt);
        log(`Pedido #${order.order_number} impresso.`);
      } catch (err) {
        log(`Falha ao imprimir pedido #${order.order_number}: ${err.message}`);
      }
      state.lastCheckedAt = order.created_at;
      saveState(state);
    }
  }

  await checkNewOrders();
  setInterval(checkNewOrders, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
