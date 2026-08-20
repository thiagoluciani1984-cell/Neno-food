import { describe, expect, it } from "vitest";
import { getSupplyBatchReceiptLines } from "./print-batch-receipt";

describe("getSupplyBatchReceiptLines", () => {
  it("monta um resumo organizado com cabeçalho, itens e total do lote", () => {
    const lines = getSupplyBatchReceiptLines(
      {
        key: "closed-1",
        label: "Fechado em 03/08/2026 14:30",
        isOpen: false,
        entries: [
          {
            id: "e1",
            item_name: "Farinha",
            quantity: 2,
            unit_type: "kg",
            unit_price_cents: 4500,
            total_cents: 9000,
            notes: null,
          } as any,
        ],
        totalCents: 9000,
      },
      "Nenos Food"
    );

    expect(lines[0]).toBe("Nenos Food");
    expect(lines).toContain("RELATORIO DE INSUMOS");
    expect(lines).toContain("Fechado em 03/08/2026 14:30");
    expect(lines.some((line) => line.includes("Farinha"))).toBe(true);
    expect(lines.some((line) => line.includes("R$ 90,00"))).toBe(true);
  });
});
