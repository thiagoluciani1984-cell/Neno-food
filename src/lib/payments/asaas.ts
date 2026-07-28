import "server-only";
import type {
  CreatePaymentOrderInput,
  PaymentResult,
  AsaasWebhookPayload,
} from "./types";

function apiBase(): string {
  return process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY?.trim();
  if (!key) {
    throw new Error("ASAAS_API_KEY não configurada.");
  }
  return key;
}

export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY?.trim());
}

export function isAsaasSandbox(): boolean {
  return process.env.ASAAS_SANDBOX === "true";
}

export function isAsaasDevMock(): boolean {
  return process.env.ASAAS_DEV_MOCK === "true" && !isAsaasConfigured();
}

export function createMockAsaasPixOrder(orderId: string): PaymentResult {
  return {
    type: "pix",
    data: {
      chargeId: `mock_${orderId}`,
      orderCode: orderId,
      qrCode:
        "00020126580014BR.GOV.BCB.PIX0136mock-dev-nenos-food00053039865802BR5925Nenos Food Dev6009SAO PAULO62070503***6304ABCD",
      qrCodeUrl: null,
      qrCodeImageBase64: null,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    },
  };
}

export function createMockAsaasCreditCardOrder(orderId: string): PaymentResult {
  return {
    type: "credit_card",
    data: {
      chargeId: `mock_cc_${orderId}`,
      orderCode: orderId,
      checkoutUrl: null,
    },
  };
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function centsToReais(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function asaasRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      access_token: getApiKey(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      body?.errors?.[0]?.description ?? body?.message ?? `Asaas error ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}

interface AsaasCustomer {
  id: string;
}

async function findOrCreateCustomer(customer: {
  name: string;
  email: string;
  document: string;
  phone: string;
}): Promise<string> {
  const cpfCnpj = onlyDigits(customer.document);

  const existing = await asaasRequest<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${cpfCnpj}`
  );
  if (existing.data?.[0]?.id) return existing.data[0].id;

  const created = await asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: customer.name,
      email: customer.email,
      cpfCnpj,
      phone: onlyDigits(customer.phone),
      mobilePhone: onlyDigits(customer.phone),
    }),
  });

  return created.id;
}

export function buildSplit(
  restaurantWalletId?: string | null,
  platformFeePercent?: number | null
) {
  if (!restaurantWalletId) return undefined;

  const platformFee =
    platformFeePercent ?? Number(process.env.ASAAS_PLATFORM_FEE_PERCENT ?? "10");
  const restaurantShare = Math.max(0, 100 - platformFee);

  return [
    {
      walletId: restaurantWalletId,
      percentualValue: restaurantShare,
    },
  ];
}

interface AsaasPaymentResponse {
  id: string;
  status: string;
  invoiceUrl?: string | null;
}

interface AsaasPixQrCodeResponse {
  encodedImage?: string | null;
  payload?: string | null;
  expirationDate?: string | null;
}

export async function createAsaasOrder(
  input: CreatePaymentOrderInput
): Promise<PaymentResult> {
  const customerId = await findOrCreateCustomer(input.customer);

  const payload: Record<string, unknown> = {
    customer: customerId,
    billingType: input.paymentType === "pix" ? "PIX" : "CREDIT_CARD",
    value: centsToReais(input.totalCents),
    dueDate: todayDate(),
    description: `Pedido #${input.orderNumber} — ${input.restaurantName}`,
    externalReference: input.orderId,
  };

  const split = buildSplit(input.restaurantWalletId, input.platformFeePercent);
  if (split) payload.split = split;

  const payment = await asaasRequest<AsaasPaymentResponse>("/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (input.paymentType === "pix") {
    const qr = await asaasRequest<AsaasPixQrCodeResponse>(
      `/payments/${payment.id}/pixQrCode`
    );

    return {
      type: "pix",
      data: {
        chargeId: payment.id,
        orderCode: input.orderId,
        qrCode: qr.payload ?? null,
        qrCodeUrl: null,
        qrCodeImageBase64: qr.encodedImage ?? null,
        expiresAt: qr.expirationDate ?? null,
      },
    };
  }

  return {
    type: "credit_card",
    data: {
      chargeId: payment.id,
      orderCode: input.orderId,
      checkoutUrl: payment.invoiceUrl ?? null,
    },
  };
}

export function extractOrderIdFromWebhook(
  payload: AsaasWebhookPayload
): string | null {
  return payload.payment?.externalReference ?? null;
}

const PAID_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const FAILED_EVENTS = new Set([
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
]);
const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);
const FAILED_STATUSES = new Set(["OVERDUE", "REFUNDED", "PAYMENT_DELETED"]);

export function resolveAsaasPaymentStatus(
  eventType: string,
  chargeStatus?: string
): "paid" | "pending" | "failed" {
  if (PAID_EVENTS.has(eventType) || (chargeStatus && PAID_STATUSES.has(chargeStatus))) {
    return "paid";
  }
  if (FAILED_EVENTS.has(eventType) || (chargeStatus && FAILED_STATUSES.has(chargeStatus))) {
    return "failed";
  }
  return "pending";
}

export async function getAsaasChargeStatus(
  chargeId: string
): Promise<"paid" | "pending" | "failed"> {
  if (chargeId.startsWith("mock_")) return "pending";

  const payment = await asaasRequest<AsaasPaymentResponse>(`/payments/${chargeId}`);
  return resolveAsaasPaymentStatus("", payment.status);
}
