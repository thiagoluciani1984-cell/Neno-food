import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { Order, Payment } from "@/types/database.types";

export interface OrderPaymentView {
  order: Pick<Order, "id" | "order_number" | "status" | "total_cents" | "payment_status">;
  payment: Pick<
    Payment,
    "status" | "method" | "provider" | "provider_payload" | "amount_cents"
  > | null;
}

export async function getOrderPaymentView(
  orderId: string
): Promise<OrderPaymentView | null> {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, total_cents, payment_status")
    .eq("id", orderId)
    .maybeSingle<Order>();

  if (!order) return null;

  const { data: payment } = await supabase
    .from("payments")
    .select("status, method, provider, provider_payload, amount_cents")
    .eq("order_id", orderId)
    .maybeSingle<Payment>();

  return { order, payment };
}
