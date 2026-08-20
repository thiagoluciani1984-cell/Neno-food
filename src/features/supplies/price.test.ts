import { describe, expect, it } from "vitest";
import { getSupplyEntryEffectiveTotalCents, resolveSupplyItemReplacement, buildDisplaySupplyEntry } from "./price";

describe("getSupplyEntryEffectiveTotalCents", () => {
  it("usa o preço atual do item quando o lançamento veio sem preço", () => {
    const entry = {
      quantity: 3,
      unit_price_cents: 0,
      total_cents: 0,
    } as any;
    const item = {
      default_price_cents: 4500,
    } as any;

    expect(getSupplyEntryEffectiveTotalCents(entry, item)).toBe(13500);
  });

  it("usa o preço atual do catalogo para o lote mesmo quando o lançamento antigo tinha outro valor", () => {
    const entry = {
      quantity: 2,
      unit_price_cents: 2500,
      total_cents: 5000,
    } as any;
    const item = {
      default_price_cents: 4500,
    } as any;

    expect(getSupplyEntryEffectiveTotalCents(entry, item)).toBe(9000);
  });

  it("substitui o item removido pelo equivalente existente no catálogo", () => {
    const replacement = resolveSupplyItemReplacement("Sorvete (pote 5L)", [{ name: "Sorvete 2L", default_price_cents: 2800 } as any]);

    expect(replacement?.name).toBe("Sorvete 2L");
    expect(replacement?.default_price_cents).toBe(2800);
  });

  it("cria uma entrada de exibição para o sorvete de 2L com uma unidade a mais", () => {
    const entry = buildDisplaySupplyEntry(
      { quantity: 1, item_name: "Sorvete (pote 5L)" } as any,
      null,
      { name: "Sorvete 2L", default_price_cents: 2800 } as any
    );

    expect(entry?.item_name).toBe("Sorvete 2L");
    expect(entry?.quantity).toBe(2);
  });
});
