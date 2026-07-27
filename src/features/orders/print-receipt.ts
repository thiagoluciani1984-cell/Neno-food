import { ReceiptBuilder } from "@/lib/printer/escpos";
import { formatBRL } from "@/lib/money";
import type { OrderWithItems } from "@/types/database.types";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão na entrega",
  online: "Pago online",
};

/** Monta o cupom térmico de um pedido, no mesmo espírito do que iFood/99Food imprimem. */
export function buildOrderReceipt(order: OrderWithItems, restaurantName: string): Uint8Array {
  const receipt = new ReceiptBuilder().init();

  receipt.align("center").bold(true).doubleSize(true).text(restaurantName);
  receipt.doubleSize(false).bold(false);
  receipt.text(order.type === "delivery" ? "ENTREGA" : "RETIRADA");
  receipt.divider();

  receipt.align("left");
  receipt.bold(true).text(`Pedido #${order.order_number}`).bold(false);
  receipt.text(
    new Date(order.created_at).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    })
  );
  receipt.divider();

  receipt.bold(true).text(order.customer_name ?? "Cliente").bold(false);
  if (order.customer_phone) receipt.text(order.customer_phone);
  if (order.type === "delivery" && order.delivery_address) {
    const addr = order.delivery_address;
    receipt.text(`${addr.street}, ${addr.number}`);
    if (addr.complement) receipt.text(addr.complement);
    receipt.text(`${addr.district} - ${addr.city}/${addr.state}`);
    if (addr.reference) receipt.text(`Ref: ${addr.reference}`);
  }
  receipt.divider();

  for (const item of order.order_items) {
    receipt.row(`${item.quantity}x ${item.product_name}`, formatBRL(item.total_cents));
    for (const opt of item.order_item_options ?? []) {
      const label =
        opt.quantity > 1 ? `  + ${opt.option_item_name} (${opt.quantity}x)` : `  + ${opt.option_item_name}`;
      receipt.text(label);
    }
    if (item.notes) receipt.text(`  Obs: ${item.notes}`);
  }
  receipt.divider();

  if (order.notes) {
    receipt.bold(true).text("OBSERVAÇÕES DO PEDIDO:").bold(false);
    receipt.text(order.notes);
    receipt.divider();
  }

  receipt.row("Subtotal", formatBRL(order.subtotal_cents));
  if (order.delivery_fee_cents > 0) receipt.row("Entrega", formatBRL(order.delivery_fee_cents));
  if (order.discount_cents > 0) receipt.row("Desconto", `-${formatBRL(order.discount_cents)}`);
  receipt.bold(true).row("TOTAL", formatBRL(order.total_cents)).bold(false);
  receipt.divider();

  receipt.text(`Pagamento: ${PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}`);
  if (order.payment_method === "cash" && order.change_for_cents) {
    receipt.text(`Troco para: ${formatBRL(order.change_for_cents)}`);
  }

  receipt.feed(1).align("center").text("Nenos Food");
  receipt.cut();

  return receipt.build();
}
