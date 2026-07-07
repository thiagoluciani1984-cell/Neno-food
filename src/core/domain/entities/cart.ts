import type { Product } from "@/types/database.types";

export interface CartItemOption {
  optionId: string;
  optionItemId: string;
  optionName: string;
  optionItemName: string;
  unitPriceCents: number;
  quantity: number;
}

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  basePriceCents: number;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  notes?: string;
  options: CartItemOption[];
}

export function buildCartLineId(
  productId: string,
  options: Pick<CartItemOption, "optionItemId" | "quantity">[] = []
): string {
  if (!options.length) return productId;
  const signature = [...options]
    .sort((a, b) => a.optionItemId.localeCompare(b.optionItemId))
    .map((o) => `${o.optionItemId}:${o.quantity}`)
    .join("|");
  return `${productId}::${signature}`;
}

export function optionsTotalCents(options: CartItemOption[]): number {
  return options.reduce((sum, o) => sum + o.unitPriceCents * o.quantity, 0);
}

export function effectivePriceCents(
  product: Pick<Product, "price_cents" | "promo_price_cents">
): number {
  return product.promo_price_cents ?? product.price_cents;
}

export function cartItemUnitPriceCents(
  basePriceCents: number,
  options: CartItemOption[] = []
): number {
  return basePriceCents + optionsTotalCents(options);
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

export function formatCartItemOptions(item: CartItem): string {
  if (!item.options.length) return "";
  return item.options
    .map((o) =>
      o.quantity > 1
        ? `${o.optionItemName} (${o.quantity}x)`
        : o.optionItemName
    )
    .join(", ");
}

/**
 * Calcula o desconto de um cupom sobre um subtotal (em centavos).
 */
export function computeCouponDiscountCents(params: {
  type: "percentage" | "fixed" | "free_shipping";
  valuePercent?: number | null;
  valueCents?: number;
  maxDiscountCents?: number | null;
  subtotalCents: number;
  deliveryFeeCents: number;
}): number {
  const {
    type,
    valuePercent,
    valueCents,
    maxDiscountCents,
    subtotalCents,
    deliveryFeeCents,
  } = params;

  if (type === "free_shipping") return deliveryFeeCents;

  if (type === "percentage") {
    let discount = Math.round((subtotalCents * (valuePercent ?? 0)) / 100);
    if (maxDiscountCents != null) discount = Math.min(discount, maxDiscountCents);
    return Math.min(discount, subtotalCents);
  }

  return Math.min(valueCents ?? 0, subtotalCents);
}
