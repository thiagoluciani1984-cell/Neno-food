import type { Product } from "@/types/database.types";

export interface CartItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  notes?: string;
}

export function effectivePriceCents(product: Pick<Product, "price_cents" | "promo_price_cents">): number {
  return product.promo_price_cents ?? product.price_cents;
}

export function lineTotalCents(item: CartItem): number {
  return item.unitPriceCents * item.quantity;
}

export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotalCents(item), 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calcula o desconto de um cupom sobre um subtotal (em centavos).
 * Regras puras, sem dependências externas — fácil de testar.
 */
export function computeCouponDiscountCents(params: {
  type: "percentage" | "fixed" | "free_shipping";
  valuePercent?: number | null;
  valueCents?: number;
  maxDiscountCents?: number | null;
  subtotalCents: number;
  deliveryFeeCents: number;
}): number {
  const { type, valuePercent, valueCents, maxDiscountCents, subtotalCents, deliveryFeeCents } = params;

  if (type === "free_shipping") return deliveryFeeCents;

  if (type === "percentage") {
    let discount = Math.round((subtotalCents * (valuePercent ?? 0)) / 100);
    if (maxDiscountCents != null) discount = Math.min(discount, maxDiscountCents);
    return Math.min(discount, subtotalCents);
  }

  // fixed
  return Math.min(valueCents ?? 0, subtotalCents);
}
