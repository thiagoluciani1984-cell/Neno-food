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

  const { error: paymentError } = await supabase
    .from("payments")
    .update(paymentUpdate)
    .eq("order_id", orderId);
  if (paymentError) throw paymentError;

  const { data: currentOrder, error: orderReadError } = await supabase
    .from("orders")
    .select("status, payment_status")
    .eq("id", orderId)
    .single<{ status: OrderStatus; payment_status: "pending" | "paid" | "failed" | "refunded" }>();

  if (orderReadError) throw orderReadError;
  if (!currentOrder) {
    return { updated: false, orderStatus };
  }

  // Eventos do Asaas podem chegar fora de ordem. Um evento antigo de falha
  // nunca pode desfazer um pagamento que já foi confirmado.
  if (currentOrder.payment_status === "paid" && paymentStatus !== "paid") {
    return { updated: false, orderStatus: currentOrder.status };
  }

  // Só avança o pedido a partir de um evento de pagamento se ele ainda
  // estiver esperando confirmação. Um webhook atrasado ou duplicado que
  // chega depois do pedido já ter avançado manualmente (ou já ter sido
  // entregue/cancelado) NUNCA deve reabrir/regredir o status do pedido —
  // só o payment_status é atualizado, pra manter o registro de pagamento
  // correto sem corromper o estado do pedido.
  if (currentOrder.status !== "payment_pending") {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", orderId);
    if (error) throw error;
    return { updated: false, orderStatus: currentOrder.status };
  }

  if (orderStatus === "payment_pending") {
    return { updated: false, orderStatus: currentOrder.status };
  }

  const timestamps: Record<string, string> = {};
  if (orderStatus === "cancelled") {
    timestamps.cancelled_at = new Date().toISOString();
  }

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      status: orderStatus,
      payment_status: paymentStatus,
      ...timestamps,
    })
    .eq("id", orderId);
  if (orderUpdateError) throw orderUpdateError;

  await notifyOrderStatusChange(orderId, orderStatus);

  return { updated: true, orderStatus };
}
