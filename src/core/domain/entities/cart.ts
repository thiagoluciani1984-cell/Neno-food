import type { Product } from "@/types/database.types";

export interface CartItemOption {
  optionId: string;
  optionItemId: string;
  optionName: string;
  optionItemName: string;
  unitPriceCents: number;
  quantity: number;
  /** "max_price" = opção substitui o preço base pela mais cara do grupo (ex: pizza meio a meio), em vez de somar. */
  pricingMode?: "sum" | "max_price";
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

/**
 * Preço base + opções "sum" somadas — exceto grupos "max_price" (ex: sabores
 * de pizza meio a meio), que SUBSTITUEM o preço base pelo preço da opção
 * mais cara escolhida no grupo, em vez de somar. Mesma regra usada no
 * recálculo autoritativo do servidor (resolveCheckoutItemOptions).
 */
export function cartItemUnitPriceCents(
  basePriceCents: number,
  options: CartItemOption[] = []
): number {
  let sumAdditionsCents = 0;
  const maxByGroup = new Map<string, number>();

  for (const o of options) {
    if (o.pricingMode === "max_price") {
      maxByGroup.set(o.optionId, Math.max(maxByGroup.get(o.optionId) ?? 0, o.unitPriceCents));
    } else {
      sumAdditionsCents += o.unitPriceCents * o.quantity;
    }
  }

  let maxPriceOverrideCents: number | null = null;
  for (const groupMaxCents of maxByGroup.values()) {
    maxPriceOverrideCents = Math.max(maxPriceOverrideCents ?? 0, groupMaxCents);
  }

  return (maxPriceOverrideCents ?? basePriceCents) + sumAdditionsCents;
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
