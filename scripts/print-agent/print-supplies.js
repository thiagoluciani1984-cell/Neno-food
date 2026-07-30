const { ReceiptBuilder } = require("./escpos");

const UNIT_LABEL = { kg: "kg", unit: "un" };

/** Cupom com a lista de insumos pendentes de aprovação de um restaurante. */
function buildSupplyListReceipt(entries, restaurantName) {
  const receipt = new ReceiptBuilder().init();

  receipt.align("center").bold(true).doubleSize(true).text("INSUMOS");
  receipt.doubleSize(false);
  receipt.text(restaurantName);
  receipt.bold(false);
  receipt.divider();

  receipt.align("left");
  if (entries.length > 0) {
    const dates = entries.map((e) => e.taken_at).sort();
    receipt.text(`Periodo: ${dates[0]} a ${dates[dates.length - 1]}`);
  }
  receipt.text(`${entries.length} lancamento(s) pendente(s)`);
  receipt.divider();

  for (const entry of entries) {
    const qty = `${entry.quantity}${UNIT_LABEL[entry.unit_type] ?? entry.unit_type}`;
    receipt.row(entry.item_name, qty);
  }
  receipt.divider();

  receipt.align("center").bold(true);
  receipt.text("PENDENTE DE APROVACAO");
  receipt.bold(false);
  receipt.text("Confira valores no painel");
  receipt.text("antes de aprovar.");

  receipt.feed(1).text("Nenos Food");
  receipt.cut();

  return receipt.build();
}

module.exports = { buildSupplyListReceipt };
