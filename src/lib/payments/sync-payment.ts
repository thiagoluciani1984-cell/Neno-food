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

  if (!currentOrder || currentOrder.status === orderStatus) {
    return { updated: false, orderStatus: currentOrder?.status ?? orderStatus };
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
