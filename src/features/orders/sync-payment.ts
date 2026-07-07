import "server-only";
import { createAdminClient } from "@/infra/supabase/admin";
import {
  applyOrderPaymentUpdate,
  getPagarmeChargeStatus,
  isPagarmeDevMock,
} from "@/lib/payments";

export async function syncOrderPaymentFromGateway(orderId: string) {
  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("provider_ref, status")
    .eq("order_id", orderId)
    .maybeSingle<{ provider_ref: string | null; status: string }>();

  if (!payment?.provider_ref) {
    return { ok: false as const, error: "Pagamento não encontrado." };
  }

  if (payment.provider_ref.startsWith("mock_")) {
    return {
      ok: true as const,
      status: "pending" as const,
      mock: true,
      updated: false,
    };
  }

  const gatewayStatus = await getPagarmeChargeStatus(payment.provider_ref);
  const result = await applyOrderPaymentUpdate(
    orderId,
    gatewayStatus,
    payment.provider_ref
  );

  return {
    ok: true as const,
    status: gatewayStatus,
    mock: false,
    updated: result.updated,
    orderStatus: result.orderStatus,
  };
}

export async function confirmMockOrderPayment(orderId: string) {
  if (!isPagarmeDevMock()) {
    return { ok: false as const, error: "Modo mock indisponível." };
  }

  const supabase = createAdminClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("provider_ref")
    .eq("order_id", orderId)
    .maybeSingle<{ provider_ref: string | null }>();

  if (!payment?.provider_ref?.startsWith("mock_")) {
    return { ok: false as const, error: "Pedido não é um pagamento mock." };
  }

  await applyOrderPaymentUpdate(orderId, "paid", payment.provider_ref);
  return { ok: true as const };
}
