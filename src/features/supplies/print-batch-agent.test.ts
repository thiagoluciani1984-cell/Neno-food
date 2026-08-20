import { describe, expect, it } from "vitest";

const { getEffectiveSupplyEntryTotalCents, buildSupplyBatchReceipt } = require("../../../scripts/print-agent/print-batch.js");

describe("getEffectiveSupplyEntryTotalCents", () => {
  it("usa o preço atual do item quando o total antigo está zerado", () => {
    expect(
      getEffectiveSupplyEntryTotalCents(
        { quantity: 3, unit_price_cents: 1000, total_cents: 0 },
        { default_price_cents: 4500 }
      )
    ).toBe(13500);
  });
});

describe("buildSupplyBatchReceipt", () => {
  it("não quebra quando há entradas incompletas no lote", () => {
    expect(() =>
      buildSupplyBatchReceipt(
        {
          label: "Fechado em teste",
          entries: [undefined, { item_name: "Pizza", quantity: 1, unit_type: undefined }],
          items: [],
          totalCents: 0,
        },
        "Point da Pizza"
      )
    ).not.toThrow();
  });
});
