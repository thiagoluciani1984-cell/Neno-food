/**
 * Cupom de um lote fechado de insumos (porta 1:1 de
 * src/features/supplies/price.ts + print-batch-receipt.ts pra rodar em
 * Node puro, sem depender do build do Next.js).
 */
const { ReceiptBuilder } = require("./escpos");

const UNIT_LABEL = { kg: "kg", unit: "un" };

function getEffectiveSupplyEntryTotalCents(entry, item) {
  const quantity = Number(entry?.quantity) || 0;
  const currentItemPriceCents = Number(item?.default_price_cents) || 0;

  if (currentItemPriceCents > 0) {
    return Math.round(quantity * currentItemPriceCents);
  }

  const unitPriceCents = Number(entry?.unit_price_cents) || 0;
  if (unitPriceCents > 0) {
    return Math.round(quantity * unitPriceCents);
  }

  return Number(entry?.total_cents) || 0;
}

function formatBRL(cents) {
  return `R$ ${((Number(cents) || 0) / 100).toFixed(2).replace(".", ",")}`;
}

function formatEntryDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleDateString("pt-BR");
}

function formatEntrySummary(entry) {
  const unitLabel = UNIT_LABEL[entry?.unit_type] ?? entry?.unit_type ?? "";
  const quantity = entry?.quantity ?? 0;
  const name = entry?.item_name ?? "Item";
  const takenAt = formatEntryDate(entry?.taken_at);
  return `${name} (${quantity} ${unitLabel}${takenAt ? ` · pego em ${takenAt}` : ""})`;
}

/** Cupom do lote fechado — batch: { label, entries, items, totalCents }. */
function buildSupplyBatchReceipt(batch, restaurantName) {
  const itemsById = new Map((batch?.items ?? []).map((item) => [item.id, item]));
  const entries = (batch?.entries ?? []).filter(Boolean);

  const receipt = new ReceiptBuilder().init();
  receipt.align("center").bold(true).doubleSize(true).text(restaurantName ?? "Nenos Food");
  receipt.doubleSize(false).bold(false);
  receipt.text("RELATORIO DE INSUMOS");
  receipt.text(batch?.label ?? "");
  receipt.divider();

  receipt.align("left");
  receipt.bold(true).text("ITENS").bold(false);

  let computedTotalCents = 0;
  entries.forEach((entry) => {
    const item = entry.item_id ? itemsById.get(entry.item_id) : null;
    const totalCents = getEffectiveSupplyEntryTotalCents(entry, item);
    computedTotalCents += totalCents;

    receipt.text(formatEntrySummary(entry));
    receipt.align("right").text(formatBRL(totalCents)).align("left");
    if (entry.notes) receipt.text(`Obs: ${entry.notes}`);
  });

  receipt.divider();
  const totalCents = Number(batch?.totalCents) > 0 ? Number(batch.totalCents) : computedTotalCents;
  receipt.bold(true).text(`TOTAL DO LOTE: ${formatBRL(totalCents)}`).bold(false);
  receipt.feed(1).align("center").text("Nenos Food");
  receipt.cut();
  return receipt.build();
}

module.exports = { getEffectiveSupplyEntryTotalCents, buildSupplyBatchReceipt };
