import type {
  CreatePagarmeOrderInput,
  PagarmePaymentResult,
  PagarmeWebhookPayload,
} from "./types";

const API_BASE = "https://api.pagar.me/core/v5";

function getSecretKey(): string {
  const key = process.env.PAGARME_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("PAGARME_SECRET_KEY não configurada.");
  }
  return key;
}

export function isPagarmeConfigured(): boolean {
  return Boolean(process.env.PAGARME_SECRET_KEY?.trim());
}

export function isPagarmeSandbox(): boolean {
  return (process.env.PAGARME_SECRET_KEY ?? "").includes("_test_");
}

export function isPagarmeDevMock(): boolean {
  return process.env.PAGARME_DEV_MOCK === "true" && !isPagarmeConfigured();
}

export function createMockPagarmePixOrder(
  orderId: string
): PagarmePaymentResult {
  return {
    type: "pix",
    data: {
      chargeId: `mock_${orderId}`,
      orderCode: orderId,
      qrCode:
        "00020126580014BR.GOV.BCB.PIX0136mock-dev-nenos-food00053039865802BR5925Nenos Food Dev6009SAO PAULO62070503***6304ABCD",
      qrCodeUrl: null,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    },
  };
}

export function createMockPagarmeCreditCardOrder(
  orderId: string
): PagarmePaymentResult {
  return {
    type: "credit_card",
    data: {
      chargeId: `mock_cc_${orderId}`,
      orderCode: orderId,
      checkoutUrl: null,
    },
  };
}

function authHeader(): string {
  const secret = getSecretKey();
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function parseBrazilPhone(phone: string): {
  country_code: string;
  area_code: string;
  number: string;
} {
  const digits = onlyDigits(phone);
  const normalized =
    digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;

  if (normalized.length < 10) {
    return { country_code: "55", area_code: "11", number: "999999999" };
  }

  return {
    country_code: "55",
    area_code: normalized.slice(0, 2),
    number: normalized.slice(2),
  };
}

function buildSplit(restaurantRecipientId?: string | null) {
  const platformRecipient = process.env.PAGARME_PLATFORM_RECIPIENT_ID;
  if (!platformRecipient || !restaurantRecipientId) return undefined;

  const platformFee = Number(process.env.PAGARME_PLATFORM_FEE_PERCENT ?? "10");
  const restaurantFee = Math.max(0, 100 - platformFee);

  return [
    {
      recipient_id: platformRecipient,
      type: "percentage",
      amount: platformFee,
      options: {
        liable: true,
        charge_processing_fee: true,
        charge_remainder_fee: false,
      },
    },
    {
      recipient_id: restaurantRecipientId,
      type: "percentage",
      amount: restaurantFee,
      options: {
        liable: false,
        charge_processing_fee: false,
        charge_remainder_fee: true,
      },
    },
  ];
}

async function pagarmeRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      body?.message ??
      body?.errors?.[0]?.message ??
      `Pagar.me error ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}

interface PagarmeOrderResponse {
  id: string;
  code: string;
  charges?: Array<{
    id: string;
    status: string;
    last_transaction?: {
      qr_code?: string;
      qr_code_url?: string;
      expires_at?: string;
      url?: string;
    };
  }>;
}

export async function createPagarmeOrder(
  input: CreatePagarmeOrderInput
): Promise<PagarmePaymentResult> {
  const phone = parseBrazilPhone(input.customer.phone);
  const document = onlyDigits(input.customer.document);

  const paymentBase: Record<string, unknown> = {
    amount: input.totalCents,
    payment_method: input.paymentType === "pix" ? "pix" : "credit_card",
  };

  const split = buildSplit(input.restaurantRecipientId);
  if (split) paymentBase.split = split;

  if (input.paymentType === "pix") {
    paymentBase.pix = {
      expires_in: Number(process.env.PAGARME_PIX_EXPIRES_IN ?? "3600"),
      additional_information: [
        { name: "Pedido", value: `#${input.orderNumber}` },
        { name: "Restaurante", value: input.restaurantName },
      ],
    };
  } else {
    paymentBase.credit_card = {
      installments: 1,
      statement_descriptor: input.restaurantName.slice(0, 13),
      capture: true,
    };
  }

  const payload = {
    code: input.orderId,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      document,
      type: "individual",
      phones: {
        mobile_phone: {
          country_code: phone.country_code,
          area_code: phone.area_code,
          number: phone.number,
        },
      },
    },
    items: input.items.map((item) => ({
      code: item.productId,
      description: item.name,
      quantity: item.quantity,
      amount: item.unitPriceCents,
    })),
    payments: [paymentBase],
    metadata: {
      order_id: input.orderId,
      order_number: String(input.orderNumber),
    },
    closed: true,
  };

  const order = await pagarmeRequest<PagarmeOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const charge = order.charges?.[0];
  if (!charge) {
    throw new Error("Pagar.me não retornou cobrança.");
  }

  const tx = charge.last_transaction;

  if (input.paymentType === "pix") {
    return {
      type: "pix",
      data: {
        chargeId: charge.id,
        orderCode: order.code,
        qrCode: tx?.qr_code ?? null,
        qrCodeUrl: tx?.qr_code_url ?? null,
        expiresAt: tx?.expires_at ?? null,
      },
    };
  }

  return {
    type: "credit_card",
    data: {
      chargeId: charge.id,
      orderCode: order.code,
      checkoutUrl: tx?.url ?? null,
    },
  };
}

export function extractOrderIdFromWebhook(
  payload: PagarmeWebhookPayload
): string | null {
  const metadataOrderId = payload.data?.metadata?.order_id;
  if (metadataOrderId) return metadataOrderId;

  const code = payload.data?.code;
  if (code && /^[0-9a-f-]{36}$/i.test(code)) return code;

  return null;
}

export function resolvePagarmePaymentStatus(
  eventType: string,
  chargeStatus?: string
): "paid" | "pending" | "failed" {
  if (eventType === "order.paid" || eventType === "charge.paid") {
    return "paid";
  }

  if (
    eventType === "order.payment_failed" ||
    eventType === "charge.payment_failed" ||
    chargeStatus === "failed" ||
    chargeStatus === "canceled"
  ) {
    return "failed";
  }

  return "pending";
}

interface PagarmeChargeResponse {
  id: string;
  status: string;
}

export async function getPagarmeChargeStatus(
  chargeId: string
): Promise<"paid" | "pending" | "failed"> {
  if (chargeId.startsWith("mock_")) return "pending";

  const charge = await pagarmeRequest<PagarmeChargeResponse>(
    `/charges/${chargeId}`
  );

  if (charge.status === "paid") return "paid";
  if (charge.status === "failed" || charge.status === "canceled") {
    return "failed";
  }
  return "pending";
}
