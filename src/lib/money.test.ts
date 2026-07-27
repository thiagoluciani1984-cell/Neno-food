import { describe, it, expect } from "vitest";
import { formatBRL, reaisToCents, centsToReais } from "./money";

// Intl.NumberFormat(pt-BR) usa espaco nao-quebravel (U+00A0/U+202F) entre
// R$ e o valor, dependendo da versao do ICU - normaliza pra comparar.
function normalizeSpaces(s: string): string {
  return s.replace(/[  ]/g, " ");
}

describe("formatBRL", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(normalizeSpaces(formatBRL(3499))).toBe("R$ 34,99");
  });

  it("formata zero corretamente", () => {
    expect(normalizeSpaces(formatBRL(0))).toBe("R$ 0,00");
  });
});

describe("reaisToCents", () => {
  it("converte string com virgula decimal", () => {
    expect(reaisToCents("34,99")).toBe(3499);
  });

  it("converte number diretamente", () => {
    expect(reaisToCents(50)).toBe(5000);
  });

  it("valor invalido vira 0, nunca NaN", () => {
    expect(reaisToCents("abc")).toBe(0);
  });
});

describe("round-trip reais <-> centavos", () => {
  it("nao perde precisao em valores comuns de cardapio", () => {
    for (const cents of [199, 3499, 4990, 12000, 799]) {
      expect(reaisToCents(centsToReais(cents).toFixed(2))).toBe(cents);
    }
  });
});
