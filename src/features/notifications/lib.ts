import "server-only";
import { createAdminClient } from "@/infra/supabase/admin";
import { ORDER_STATUS_LABEL } from "@/core/domain/value-objects/order-status";
import type { OrderStatus } from "@/types/database.types";

export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: OrderStatus
): Promise<void> {
  if (newStatus === "payment_pending") return;

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, customer_id, customers(profile_id)")
    .eq("id", orderId)
    .single<{
      order_number: number;
      customer_id: string | null;
      customers: { profile_id: string } | null;
    }>();

  const profileId = order?.customers?.profile_id;
  if (!profileId) return;

  await supabase.from("notifications").insert({
    user_id: profileId,
    type: "order_update",
    title: `Pedido #${order.order_number}`,
    body: ORDER_STATUS_LABEL[newStatus],
    payload: { order_id: orderId, status: newStatus },
  });
}
