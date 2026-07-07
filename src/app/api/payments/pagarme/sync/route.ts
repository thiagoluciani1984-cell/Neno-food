import { NextRequest, NextResponse } from "next/server";
import { syncOrderPaymentFromGateway } from "@/features/orders/sync-payment";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order");
  if (!orderId) {
    return NextResponse.json({ error: "order required" }, { status: 400 });
  }

  try {
    const result = await syncOrderPaymentFromGateway(orderId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[pagarme-sync]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "sync failed" },
      { status: 500 }
    );
  }
}
