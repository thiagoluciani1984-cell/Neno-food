export type OnlinePaymentType = "pix" | "credit_card";

export interface PagarmeOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface PagarmeCustomerInput {
  name: string;
  email: string;
  document: string;
  phone: string;
}

export interface CreatePagarmeOrderInput {
  orderId: string;
  orderNumber: number;
  restaurantName: string;
  restaurantRecipientId?: string | null;
  totalCents: number;
  items: PagarmeOrderItem[];
  customer: PagarmeCustomerInput;
  paymentType: OnlinePaymentType;
}

export interface PagarmePixPaymentData {
  chargeId: string;
  orderCode: string;
  qrCode: string | null;
  qrCodeUrl: string | null;
  expiresAt: string | null;
}

export interface PagarmeCheckoutPaymentData {
  chargeId: string;
  orderCode: string;
  checkoutUrl: string | null;
}

export type PagarmePaymentResult =
  | { type: "pix"; data: PagarmePixPaymentData }
  | { type: "credit_card"; data: PagarmeCheckoutPaymentData };

export interface PagarmeWebhookPayload {
  type?: string;
  data?: {
    id?: string;
    code?: string;
    status?: string;
    metadata?: Record<string, string>;
    charges?: Array<{
      id?: string;
      status?: string;
      metadata?: Record<string, string>;
    }>;
  };
}
