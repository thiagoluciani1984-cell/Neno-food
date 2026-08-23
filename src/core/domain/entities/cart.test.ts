import { describe, it, expect } from "vitest";
import { computeCouponDiscountCents, cartItemUnitPriceCents } from "./cart";
import type { CartItemOption } from "./cart";

describe("computeCouponDiscountCents", () => {
  it("aplica desconto percentual sobre o subtotal", () => {
    const discount = computeCouponDiscountCents({
      type: "percentage",
      valuePercent: 15,
      subtotalCents: 5000,
      deliveryFeeCents: 800,
    });
    expect(discount).toBe(750);
  });

  it("respeita o teto de desconto (max_discount_cents) no percentual", () => {
    const discount = computeCouponDiscountCents({
      type: "percentage",
      valuePercent: 50,
      maxDiscountCents: 1000,
      subtotalCents: 5000,
      deliveryFeeCents: 0,
    });
    expect(discount).toBe(1000);
  });

  it("desconto fixo nunca ultrapassa o subtotal", () => {
    const discount = computeCouponDiscountCents({
      type: "fixed",
      valueCents: 10000,
      subtotalCents: 3000,
      deliveryFeeCents: 0,
    });
    expect(discount).toBe(3000);
  });

  it("desconto percentual nunca ultrapassa o subtotal mesmo sem teto", () => {
    const discount = computeCouponDiscountCents({
      type: "percentage",
      valuePercent: 100,
      subtotalCents: 4200,
      deliveryFeeCents: 500,
    });
    expect(discount).toBe(4200);
  });

  it("frete grátis desconta exatamente o valor da entrega, não o subtotal", () => {
    const discount = computeCouponDiscountCents({
      type: "free_shipping",
      subtotalCents: 9999,
      deliveryFeeCents: 799,
    });
    expect(discount).toBe(799);
  });

  it("percentual sem valuePercent definido não gera desconto", () => {
    const discount = computeCouponDiscountCents({
      type: "percentage",
      subtotalCents: 5000,
      deliveryFeeCents: 0,
    });
    expect(discount).toBe(0);
  });
});

describe("cartItemUnitPriceCents", () => {
  it("pizza meio a meio: preço final é o do sabor mais caro, substituindo o preço base", () => {
    const options: CartItemOption[] = [
      { optionId: "sabores", optionItemId: "calabresa", optionName: "Sabores", optionItemName: "Calabresa", unitPriceCents: 4000, quantity: 1, pricingMode: "max_price" },
      { optionId: "sabores", optionItemId: "portuguesa", optionName: "Sabores", optionItemName: "Portuguesa", unitPriceCents: 4990, quantity: 1, pricingMode: "max_price" },
    ];
    expect(cartItemUnitPriceCents(1, options)).toBe(4990);
  });

  it("grupo max_price combina com um grupo 'sum' separado (soma normalmente por cima)", () => {
    const options: CartItemOption[] = [
      { optionId: "sabores", optionItemId: "calabresa", optionName: "Sabores", optionItemName: "Calabresa", unitPriceCents: 4000, quantity: 1, pricingMode: "max_price" },
      { optionId: "sabores", optionItemId: "portuguesa", optionName: "Sabores", optionItemName: "Portuguesa", unitPriceCents: 4990, quantity: 1, pricingMode: "max_price" },
      { optionId: "borda", optionItemId: "catupiry", optionName: "Borda", optionItemName: "Borda recheada", unitPriceCents: 800, quantity: 1, pricingMode: "sum" },
    ];
    expect(cartItemUnitPriceCents(1, options)).toBe(4990 + 800);
  });

  it("sem pricingMode definido, soma normalmente ao preço base (sem regressão)", () => {
    const options: CartItemOption[] = [
      { optionId: "extras", optionItemId: "bacon", optionName: "Extras", optionItemName: "Bacon extra", unitPriceCents: 500, quantity: 2 },
    ];
    expect(cartItemUnitPriceCents(2500, options)).toBe(2500 + 500 * 2);
  });
});
