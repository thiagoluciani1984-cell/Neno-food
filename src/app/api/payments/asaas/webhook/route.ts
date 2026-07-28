import { NextRequest, NextResponse } from "next/server";
import { captureException, captureMessage } from "@/lib/monitoring";
import {
  applyOrderPaymentUpdate,
  extractOrderIdFromWebhook,
  resolveAsaasPaymentStatus,
} from "@/lib/payments";
import type { AsaasWebhookPayload } from "@/lib/payments";

function verifyWebhookAuth(req: NextRequest): boolean {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  // Fail-closed: sem token configurado, nenhum webhook é aceito — evita que
  // uma remoção acidental da variável de ambiente destrave a rota pra
  // qualquer um forjar eventos de pagamento.
  if (!token) return false;

  return req.headers.get("asaas-access-token") === token;
}

export async function POST(req: NextRequest) {
  if (!verifyWebhookAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const eventType = payload.event ?? "";
  const chargeStatus = payload.payment?.status;
  const paymentStatus = resolveAsaasPaymentStatus(eventType, chargeStatus);
  const orderId = extractOrderIdFromWebhook(payload);

  if (!orderId) {
    captureMessage("asaas-webhook: order_id não encontrado", { eventType });
    return NextResponse.json({ ok: true });
  }

  if (
    ![
      "PAYMENT_RECEIVED",
      "PAYMENT_CONFIRMED",
      "PAYMENT_OVERDUE",
      "PAYMENT_DELETED",
      "PAYMENT_REFUNDED",
      "PAYMENT_CHARGEBACK_REQUESTED",
    ].includes(eventType)
  ) {
    return NextResponse.json({ ok: true });
  }

  const providerRef = payload.payment?.id ?? null;

  try {
    await applyOrderPaymentUpdate(orderId, paymentStatus, providerRef);
    captureMessage("asaas-webhook: pagamento atualizado", {
      eventType,
      orderId,
      paymentStatus,
    });
  } catch (error) {
    captureException(error, { eventType, orderId, paymentStatus });
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
