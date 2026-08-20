/**
 * Agente local de impressão — roda no computador do restaurante (Windows),
 * observa pedidos novos no Supabase e manda o cupom pra impressora térmica
 * usando o driver/spooler do Windows (o mesmo caminho que a página de teste
 * de impressora do Windows usa — não depende de porta serial/Web Serial).
 *
 * Uso (versão .exe compilada, sem precisar de Node.js instalado):
 *   NenosPrintAgent.exe            primeira vez pergunta a configuração;
 *                                   depois disso já inicia o monitoramento
 *   NenosPrintAgent.exe --test     imprime um cupom de teste e sai
 *   NenosPrintAgent.exe --setup    refaz a configuração (login/impressora)
 *   NenosPrintAgent.exe --print-supplies "Nome do restaurante"
 *                                   imprime a lista de insumos pendentes de
 *                                   aprovação daquele restaurante e sai
 *
 * Uso (versão Node.js, pra quem preferir): copie .env.example para .env e
 * preencha os valores manualmente — o agente usa esse arquivo se existir.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { execFile } = require("child_process");
const { createClient } = require("@supabase/supabase-js");
const { buildOrderReceipt } = require("./print-receipt");
const { buildSupplyListReceipt } = require("./print-supplies");
const { buildSupplyBatchReceipt, getEffectiveSupplyEntryTotalCents } = require("./print-batch");
const { ReceiptBuilder } = require("./escpos");

// Quando compilado com pkg, os arquivos ficam "dentro" do binário — mas
// config/estado precisam morar do LADO do .exe de verdade, não dentro dele.
const BASE_DIR = process.pkg ? path.dirname(process.execPath) : __dirname;
const CONFIG_FILE = path.join(BASE_DIR, "config.json");
const STATE_FILE = path.join(BASE_DIR, "state.json");
const ENV_FILE = path.join(BASE_DIR, ".env");

function log(msg) {
  console.log(`[${new Date().toLocaleString("pt-BR")}] ${msg}`);
}

function loadDotEnv() {
  if (!fs.existsSync(ENV_FILE)) return null;
  const raw = fs.readFileSync(ENV_FILE, "utf8").replace(/\r/g, "");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  const REQUIRED = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "RESTAURANT_EMAIL", "RESTAURANT_PASSWORD", "PRINTER_SHARE_NAME"];
  if (!REQUIRED.every((k) => env[k])) return null;
  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    email: env.RESTAURANT_EMAIL,
    password: env.RESTAURANT_PASSWORD,
    printerShareName: env.PRINTER_SHARE_NAME,
  };
}

function loadConfigFile() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return null;
  }
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function runSetupWizard() {
  console.log("\n=== Configuração do agente de impressão Nenos Food ===\n");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const email = await ask(rl, "E-mail de login do painel do restaurante: ");
  const password = await ask(rl, "Senha: ");
  const printerShareName = await ask(
    rl,
    "Nome do COMPARTILHAMENTO da impressora no Windows (veja o README se não souber): "
  );
  rl.close();

  const config = {
    supabaseUrl: "https://lelimqdzvwafxzvrkszj.supabase.co",
    supabaseAnonKey: "sb_publishable_vriFGkyFYmJl69Briw3zEw_dqK6qyME",
    email,
    password,
    printerShareName,
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`\nConfiguração salva em ${CONFIG_FILE}\n`);
  return config;
}

async function loadOrCreateConfig(forceSetup) {
  if (!forceSetup) {
    const fromEnv = loadDotEnv();
    if (fromEnv) return fromEnv;
    const fromFile = loadConfigFile();
    if (fromFile) return fromFile;
  }
  return runSetupWizard();
}

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

/** Manda bytes crus pro spooler do Windows via cópia binária pro compartilhamento da impressora. */
function printRaw(bytes, printerShareName) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `nenos-print-${Date.now()}.prn`);
    fs.writeFileSync(tempFile, bytes);
    const target = `\\\\${os.hostname()}\\${printerShareName}`;
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

async function testPrint(config) {
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
  await printRaw(receipt, config.printerShareName);
  log("Cupom de teste enviado. Se não sair nada, revise o nome do compartilhamento e se a impressora está compartilhada no Windows.");
}

/** Imprime a lista de insumos pendentes de aprovação de um restaurante (por nome). */
async function printSupplies(supabase, config, restaurantQuery) {
  log(`Procurando restaurante "${restaurantQuery}"...`);
  const { data: restaurants, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name")
    .ilike("name", `%${restaurantQuery}%`);

  if (restaurantError || !restaurants || restaurants.length === 0) {
    console.error(`Nenhum restaurante encontrado com "${restaurantQuery}" no nome.`);
    return;
  }
  if (restaurants.length > 1) {
    console.error(`Mais de um restaurante encontrado: ${restaurants.map((r) => r.name).join(", ")}`);
    console.error("Seja mais específico.");
    return;
  }
  const restaurant = restaurants[0];

  const { data: entries, error: entriesError } = await supabase
    .from("supply_entries")
    .select("item_name, quantity, unit_type, taken_at")
    .eq("restaurant_id", restaurant.id)
    .eq("status", "pending")
    .order("taken_at", { ascending: true });

  if (entriesError) {
    console.error("Falha ao buscar lançamentos:", entriesError.message);
    return;
  }
  if (!entries || entries.length === 0) {
    log(`Nenhum lançamento pendente pra ${restaurant.name}.`);
    return;
  }

  log(`Imprimindo ${entries.length} lançamento(s) de ${restaurant.name}...`);
  try {
    const receipt = buildSupplyListReceipt(entries, restaurant.name);
    await printRaw(receipt, config.printerShareName);
    log("Lista impressa.");
  } catch (err) {
    console.error("Falha ao imprimir:", err.message);
  }
}

/** Imprime um lote fechado de insumos (paid_at = batchKey) da conta logada. */
async function printClosedBatch(supabase, config, restaurantId, restaurantName, batchKey) {
  log(`Buscando lote fechado em ${batchKey}...`);
  const { data: entries, error: entriesError } = await supabase
    .from("supply_entries")
    .select("id, item_id, item_name, quantity, unit_type, unit_price_cents, total_cents, taken_at, notes, paid_at")
    .eq("restaurant_id", restaurantId)
    .eq("status", "approved")
    .eq("paid_at", batchKey)
    .order("taken_at", { ascending: true });

  if (entriesError) {
    console.error("Falha ao buscar lançamentos do lote:", entriesError.message);
    return { ok: false, error: entriesError.message };
  }
  if (!entries || entries.length === 0) {
    log("Nenhum lançamento encontrado para esse lote.");
    return { ok: false, error: "Nenhum lançamento encontrado para esse lote." };
  }

  const { data: items } = await supabase
    .from("supply_items")
    .select("id, name, default_price_cents")
    .eq("restaurant_id", restaurantId);

  const itemsById = new Map((items ?? []).map((item) => [item.id, item]));
  const totalCents = entries.reduce(
    (sum, entry) => sum + getEffectiveSupplyEntryTotalCents(entry, entry.item_id ? itemsById.get(entry.item_id) : null),
    0
  );
  const label = `Fechado em ${new Date(batchKey).toLocaleString("pt-BR")}`;

  log(`Imprimindo lote de ${entries.length} lançamento(s) — ${restaurantName}...`);
  try {
    const receipt = buildSupplyBatchReceipt({ label, entries, items: items ?? [], totalCents }, restaurantName);
    await printRaw(receipt, config.printerShareName);
    log("Lote impresso.");
    return { ok: true };
  } catch (err) {
    console.error("Falha ao imprimir:", err.message);
    return { ok: false, error: err.message };
  }
}

/** Confere a fila de pedidos de impressão de lote (gravados pelo painel web) e imprime os pendentes. */
async function checkPrintRequests(supabase, restaurantId, restaurantName, config) {
  const { data: requests, error } = await supabase
    .from("supply_print_requests")
    .select("id, batch_key")
    .eq("restaurant_id", restaurantId)
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  if (error) {
    log(`Erro ao buscar pedidos de impressão: ${error.message}`);
    return;
  }
  if (!requests || requests.length === 0) return;

  for (const request of requests) {
    const result = await printClosedBatch(supabase, config, restaurantId, restaurantName, request.batch_key);
    const update = result.ok
      ? { status: "printed", printed_at: new Date().toISOString() }
      : { status: "failed", error: result.error ?? "Falha desconhecida" };
    await supabase.from("supply_print_requests").update(update).eq("id", request.id);
  }
}

async function main() {
  const forceSetup = process.argv.includes("--setup");
  const config = await loadOrCreateConfig(forceSetup);

  if (process.argv.includes("--test") || forceSetup) {
    try {
      await testPrint(config);
    } catch (err) {
      console.error("Falha ao imprimir:", err.message);
    }
    if (!forceSetup) return;
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

  log("Entrando com a conta do restaurante...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: config.password,
  });
  if (authError) {
    console.error("Falha no login:", authError.message);
    console.error("Confira e-mail/senha. Pra corrigir, rode de novo com --setup.");
    return;
  }

  const printSuppliesFlagIndex = process.argv.indexOf("--print-supplies");
  if (printSuppliesFlagIndex !== -1) {
    const restaurantQuery = process.argv[printSuppliesFlagIndex + 1];
    if (!restaurantQuery) {
      console.error('Uso: --print-supplies "Nome do restaurante"');
      return;
    }
    await printSupplies(supabase, config, restaurantQuery);
    return;
  }

  if (process.argv.includes("--print-closed-batch")) {
    const batchKeyIndex = process.argv.indexOf("--batch-key");
    const batchKey = batchKeyIndex !== -1 ? process.argv[batchKeyIndex + 1] : "";
    if (!batchKey) {
      console.error('Uso: --print-closed-batch --batch-key "<paid_at>"');
      return;
    }

    const { data: batchProfile, error: batchProfileError } = await supabase
      .from("profiles")
      .select("restaurant_id, full_name")
      .eq("id", authData.user.id)
      .single();
    if (batchProfileError || !batchProfile?.restaurant_id) {
      console.error("Não foi possível identificar o restaurante desta conta.", batchProfileError?.message);
      return;
    }

    const { data: batchRestaurant } = await supabase
      .from("restaurants")
      .select("name")
      .eq("id", batchProfile.restaurant_id)
      .single();

    await printClosedBatch(
      supabase,
      config,
      batchProfile.restaurant_id,
      batchRestaurant?.name ?? "Nenos Food",
      batchKey
    );
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("restaurant_id, full_name")
    .eq("id", authData.user.id)
    .single();
  if (profileError || !profile?.restaurant_id) {
    console.error("Não foi possível identificar o restaurante desta conta.", profileError?.message);
    return;
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
        await printRaw(receipt, config.printerShareName);
        log(`Pedido #${order.order_number} impresso.`);
      } catch (err) {
        log(`Falha ao imprimir pedido #${order.order_number}: ${err.message}`);
      }
      state.lastCheckedAt = order.created_at;
      saveState(state);
    }
  }

  async function tick() {
    await checkNewOrders();
    await checkPrintRequests(supabase, profile.restaurant_id, restaurantName, config);
  }

  await tick();
  setInterval(tick, 8000);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
});
