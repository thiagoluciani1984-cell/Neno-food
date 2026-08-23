import { describe, it, expect } from "vitest";
import { resolveCheckoutItemOptions } from "./validate-item-options";
import type { OptionGroupWithItems } from "@/features/catalog/queries-options";

function makeGroup(overrides: Partial<OptionGroupWithItems> = {}): OptionGroupWithItems {
  return {
    id: "group-1",
    product_id: "product-1",
    name: "Sabores",
    type: "multiple",
    is_required: true,
    min_qty: 2,
    max_qty: 2,
    sort_order: 0,
    created_at: "",
    updated_at: "",
    pricing_mode: "max_price",
    product_option_items: [
      { id: "calabresa", option_id: "group-1", name: "Calabresa", price_cents: 4000, is_available: true, sort_order: 0, created_at: "", updated_at: "" },
      { id: "portuguesa", option_id: "group-1", name: "Portuguesa", price_cents: 4990, is_available: true, sort_order: 1, created_at: "", updated_at: "" },
    ],
    ...overrides,
  };
}

describe("resolveCheckoutItemOptions", () => {
  it("pizza meio a meio: cobra o preço do sabor mais caro, não a soma", () => {
    const { unitPriceCents } = resolveCheckoutItemOptions({
      productName: "Pizza Grande",
      basePriceCents: 1, // preço base irrelevante quando um grupo max_price é escolhido
      groups: [makeGroup()],
      selected: [
        { optionId: "group-1", optionItemId: "calabresa", quantity: 1 },
        { optionId: "group-1", optionItemId: "portuguesa", quantity: 1 },
      ],
    });

    expect(unitPriceCents).toBe(4990);
  });

  it("dois sabores do mesmo preço: cobra esse preço (não dobra)", () => {
    const group = makeGroup({
      product_option_items: [
        { id: "a", option_id: "group-1", name: "A", price_cents: 3000, is_available: true, sort_order: 0, created_at: "", updated_at: "" },
        { id: "b", option_id: "group-1", name: "B", price_cents: 3000, is_available: true, sort_order: 1, created_at: "", updated_at: "" },
      ],
    });
    const { unitPriceCents } = resolveCheckoutItemOptions({
      productName: "Pizza Média",
      basePriceCents: 1,
      groups: [group],
      selected: [
        { optionId: "group-1", optionItemId: "a", quantity: 1 },
        { optionId: "group-1", optionItemId: "b", quantity: 1 },
      ],
    });
    expect(unitPriceCents).toBe(3000);
  });

  it("grupo max_price soma normalmente com um grupo 'sum' separado (ex: borda recheada)", () => {
    const flavorGroup = makeGroup();
    const crustGroup = makeGroup({
      id: "group-2",
      name: "Borda",
      type: "single",
      is_required: false,
      min_qty: 0,
      max_qty: 1,
      pricing_mode: "sum",
      product_option_items: [
        { id: "borda-catupiry", option_id: "group-2", name: "Borda recheada", price_cents: 800, is_available: true, sort_order: 0, created_at: "", updated_at: "" },
      ],
    });

    const { unitPriceCents } = resolveCheckoutItemOptions({
      productName: "Pizza Grande",
      basePriceCents: 1,
      groups: [flavorGroup, crustGroup],
      selected: [
        { optionId: "group-1", optionItemId: "calabresa", quantity: 1 },
        { optionId: "group-1", optionItemId: "portuguesa", quantity: 1 },
        { optionId: "group-2", optionItemId: "borda-catupiry", quantity: 1 },
      ],
    });

    expect(unitPriceCents).toBe(4990 + 800);
  });

  it("comportamento padrão (pricing_mode 'sum') continua somando ao preço base, sem regressão", () => {
    const group = makeGroup({
      pricing_mode: "sum",
      is_required: false,
      min_qty: 0,
      max_qty: 3,
      product_option_items: [
        { id: "bacon", option_id: "group-1", name: "Bacon extra", price_cents: 500, is_available: true, sort_order: 0, created_at: "", updated_at: "" },
      ],
    });

    const { unitPriceCents } = resolveCheckoutItemOptions({
      productName: "Hambúrguer",
      basePriceCents: 2500,
      groups: [group],
      selected: [{ optionId: "group-1", optionItemId: "bacon", quantity: 2 }],
    });

    expect(unitPriceCents).toBe(2500 + 500 * 2);
  });

  it("sem nenhuma opção escolhida, usa o preço base normalmente", () => {
    const { unitPriceCents } = resolveCheckoutItemOptions({
      productName: "Pizza Grande",
      basePriceCents: 4200,
      groups: [makeGroup({ is_required: false, min_qty: 0 })],
      selected: [],
    });
    expect(unitPriceCents).toBe(4200);
  });
});
