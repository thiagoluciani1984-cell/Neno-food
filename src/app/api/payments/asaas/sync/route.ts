import { NextRequest, NextResponse } from "next/server";
import { syncOrderPaymentFromGateway } from "@/features/orders/sync-payment";
import { canAccessOrderPayment } from "@/features/orders/queries-payment";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`asaas-sync:${ip}`, 30, 60))) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const orderId = req.nextUrl.searchParams.get("order");
  if (!orderId) {
    return NextResponse.json({ error: "order required" }, { status: 400 });
  }

  if (!(await canAccessOrderPayment(orderId))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const result = await syncOrderPaymentFromGateway(orderId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[asaas-sync]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "sync failed" },
      { status: 500 }
    );
  }
}
