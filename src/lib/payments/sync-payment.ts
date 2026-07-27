import { createAdminClient } from "@/infra/supabase/admin";
import { notifyOrderStatusChange } from "@/features/notifications/lib";
import type { OrderStatus } from "@/types/database.types";

export type GatewayPaymentStatus = "paid" | "pending" | "failed";

function mapOrderStatus(paymentStatus: GatewayPaymentStatus): OrderStatus {
  if (paymentStatus === "paid") return "received";
  if (paymentStatus === "failed") return "cancelled";
  return "payment_pending";
}

export async function applyOrderPaymentUpdate(
  orderId: string,
  paymentStatus: GatewayPaymentStatus,
  providerRef?: string | null
): Promise<{ updated: boolean; orderStatus: OrderStatus }> {
  const supabase = createAdminClient();
  const orderStatus = mapOrderStatus(paymentStatus);

  const paymentUpdate: Record<string, unknown> = {
    status: paymentStatus,
    paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
  };
  if (providerRef) paymentUpdate.provider_ref = providerRef;

  await supabase.from("payments").update(paymentUpdate).eq("order_id", orderId);

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single<{ status: OrderStatus }>();

  if (!currentOrder) {
    return { updated: false, orderStatus };
  }

  // Só avança o pedido a partir de um evento de pagamento se ele ainda
  // estiver esperando confirmação. Um webhook atrasado ou duplicado que
  // chega depois do pedido já ter avançado manualmente (ou já ter sido
  // entregue/cancelado) NUNCA deve reabrir/regredir o status do pedido —
  // só o payment_status é atualizado, pra manter o registro de pagamento
  // correto sem corromper o estado do pedido.
  if (currentOrder.status !== "payment_pending") {
    await supabase.from("orders").update({ payment_status: paymentStatus }).eq("id", orderId);
    return { updated: false, orderStatus: currentOrder.status };
  }

  if (orderStatus === "payment_pending") {
    return { updated: false, orderStatus: currentOrder.status };
  }

  const timestamps: Record<string, string> = {};
  if (orderStatus === "cancelled") {
    timestamps.cancelled_at = new Date().toISOString();
  }

  await supabase
    .from("orders")
    .update({
      status: orderStatus,
      payment_status: paymentStatus,
      ...timestamps,
    })
    .eq("id", orderId);

  await notifyOrderStatusChange(orderId, orderStatus);

  return { updated: true, orderStatus };
}
