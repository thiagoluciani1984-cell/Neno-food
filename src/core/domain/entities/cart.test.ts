import { describe, it, expect } from "vitest";
import { computeCouponDiscountCents } from "./cart";

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
