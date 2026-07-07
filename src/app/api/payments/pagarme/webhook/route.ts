import { NextRequest, NextResponse } from "next/server";
import {
  applyOrderPaymentUpdate,
  extractOrderIdFromWebhook,
  resolvePagarmePaymentStatus,
} from "@/lib/payments";
import type { PagarmeWebhookPayload } from "@/lib/payments";

function verifyWebhookAuth(req: NextRequest): boolean {
  const user = process.env.PAGARME_WEBHOOK_USER;
  const pass = process.env.PAGARME_WEBHOOK_PASSWORD;
  if (!user || !pass) return true;

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;

  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const [u, p] = decoded.split(":");
  return u === user && p === pass;
}

export async function POST(req: NextRequest) {
  if (!verifyWebhookAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: PagarmeWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const eventType = payload.type ?? "";
  const chargeStatus = payload.data?.charges?.[0]?.status ?? payload.data?.status;
  const paymentStatus = resolvePagarmePaymentStatus(eventType, chargeStatus);
  const orderId = extractOrderIdFromWebhook(payload);

  if (!orderId) {
    console.warn("[pagarme-webhook] order_id não encontrado", eventType);
    return NextResponse.json({ ok: true });
  }

  if (
    ![
      "order.paid",
      "charge.paid",
      "order.payment_failed",
      "charge.payment_failed",
      "charge.pending",
      "order.created",
    ].includes(eventType)
  ) {
    return NextResponse.json({ ok: true });
  }

  const providerRef =
    payload.data?.charges?.[0]?.id ?? payload.data?.id ?? null;

  await applyOrderPaymentUpdate(orderId, paymentStatus, providerRef);

  console.log(
    `[pagarme-webhook] ${eventType} → order ${orderId} → ${paymentStatus}`
  );

  return NextResponse.json({ ok: true });
}
