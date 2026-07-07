import { NextRequest, NextResponse } from "next/server";
import { confirmMockOrderPayment } from "@/features/orders/sync-payment";
import { isPagarmeDevMock } from "@/lib/payments";

export async function POST(req: NextRequest) {
  if (!isPagarmeDevMock()) {
    return NextResponse.json({ error: "not available" }, { status: 403 });
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const result = await confirmMockOrderPayment(body.orderId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
