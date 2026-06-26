/**
 * Utilitários monetários. Toda quantia é armazenada em CENTAVOS (inteiro)
 * para evitar erros de ponto flutuante. Converta apenas na exibição.
 */

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function reaisToCents(value: number | string): number {
  const num = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function centsToReais(cents: number): number {
  return cents / 100;
}
