export type OnlinePaymentType = "pix" | "credit_card";

export interface PaymentOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface PaymentCustomerInput {
  name: string;
  email: string;
  document: string;
  phone: string;
}

export interface CreatePaymentOrderInput {
  orderId: string;
  orderNumber: number;
  restaurantName: string;
  restaurantWalletId?: string | null;
  platformFeePercent?: number | null;
  totalCents: number;
  items: PaymentOrderItem[];
  customer: PaymentCustomerInput;
  paymentType: OnlinePaymentType;
}

export interface PixPaymentData {
  chargeId: string;
  orderCode: string;
  qrCode: string | null;
  qrCodeUrl: string | null;
  qrCodeImageBase64: string | null;
  expiresAt: string | null;
}

export interface CheckoutPaymentData {
  chargeId: string;
  orderCode: string;
  checkoutUrl: string | null;
}

export type PaymentResult =
  | { type: "pix"; data: PixPaymentData }
  | { type: "credit_card"; data: CheckoutPaymentData };

export interface AsaasWebhookPayload {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    externalReference?: string | null;
  };
}
