import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infra/supabase/server";
import { mpPayment } from "@/lib/mercadopago";
import type { OrderStatus } from "@/types/database.types";

// MP payment status → order status + payment status
function resolveStatuses(mpStatus: string): {
  paymentStatus: "paid" | "pending" | "failed";
  orderStatus: OrderStatus;
} {
  switch (mpStatus) {
    case "approved":
      return { paymentStatus: "paid", orderStatus: "received" };
    case "pending":
    case "in_process":
    case "authorized":
      return { paymentStatus: "pending", orderStatus: "payment_pending" };
    default:
      // rejected, cancelled, refunded, charged_back
      return { paymentStatus: "failed", orderStatus: "cancelled" };
  }
}

export async function POST(req: NextRequest) {
  let body: { type?: string; data?: { id?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // MP also sends "test" pings — ignore non-payment events
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(body.data.id);

  let paymentData: Awaited<ReturnType<typeof mpPayment.get>>;
  try {
    paymentData = await mpPayment.get({ id: Number(paymentId) });
  } catch (err) {
    console.error("[mp-webhook] failed to get payment", paymentId, err);
    return NextResponse.json({ error: "mp_fetch_failed" }, { status: 500 });
  }

  const orderId = paymentData.external_reference;
  const mpStatus = paymentData.status ?? "pending";

  if (!orderId) {
    console.warn("[mp-webhook] no external_reference in payment", paymentId);
    return NextResponse.json({ ok: true });
  }

  const { paymentStatus, orderStatus } = resolveStatuses(mpStatus);
  const supabase = await createClient();

  await supabase
    .from("payments")
    .update({
      status: paymentStatus,
      provider_ref: paymentId,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("order_id", orderId);

  // Só atualiza o status do pedido se a transição for válida
  const { data: currentOrder } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single<{ status: OrderStatus }>();

  if (currentOrder && currentOrder.status !== orderStatus) {
    const timestamps: Record<string, string> = {};
    if (orderStatus === "cancelled") timestamps.cancelled_at = new Date().toISOString();

    await supabase
      .from("orders")
      .update({ status: orderStatus, ...timestamps })
      .eq("id", orderId);
  }

  console.log(`[mp-webhook] payment ${paymentId} → order ${orderId} → ${mpStatus} (${orderStatus})`);
  return NextResponse.json({ ok: true });
}
