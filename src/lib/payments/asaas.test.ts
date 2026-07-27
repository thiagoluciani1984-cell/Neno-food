import { describe, it, expect, beforeEach } from "vitest";
import { buildSplit, resolveAsaasPaymentStatus } from "./asaas";

describe("buildSplit", () => {
  beforeEach(() => {
    delete process.env.ASAAS_PLATFORM_FEE_PERCENT;
  });

  it("sem wallet do restaurante, não gera split (100% fica com a plataforma)", () => {
    expect(buildSplit(null, null)).toBeUndefined();
    expect(buildSplit(undefined, 10)).toBeUndefined();
  });

  it("usa a taxa por restaurante quando definida, ignorando o env", () => {
    process.env.ASAAS_PLATFORM_FEE_PERCENT = "10";
    const split = buildSplit("wallet-123", 20);
    expect(split).toEqual([{ walletId: "wallet-123", percentualValue: 80 }]);
  });

  it("cai no env (ASAAS_PLATFORM_FEE_PERCENT) quando a taxa do restaurante é nula", () => {
    process.env.ASAAS_PLATFORM_FEE_PERCENT = "12";
    const split = buildSplit("wallet-123", null);
    expect(split).toEqual([{ walletId: "wallet-123", percentualValue: 88 }]);
  });

  it("sem env nem taxa do restaurante, usa o padrão de 10%", () => {
    const split = buildSplit("wallet-123", null);
    expect(split).toEqual([{ walletId: "wallet-123", percentualValue: 90 }]);
  });

  it("nunca deixa o percentual do restaurante ser negativo mesmo com taxa > 100%", () => {
    const split = buildSplit("wallet-123", 150);
    expect(split?.[0].percentualValue).toBe(0);
  });

  it("nunca inclui a wallet da própria plataforma no array de split", () => {
    const split = buildSplit("wallet-123", 10);
    expect(split).toHaveLength(1);
    expect(split?.every((s) => s.walletId === "wallet-123")).toBe(true);
  });
});

describe("resolveAsaasPaymentStatus", () => {
  it("eventos de pagamento confirmado resolvem como paid", () => {
    expect(resolveAsaasPaymentStatus("PAYMENT_RECEIVED")).toBe("paid");
    expect(resolveAsaasPaymentStatus("PAYMENT_CONFIRMED")).toBe("paid");
  });

  it("eventos de falha resolvem como failed", () => {
    expect(resolveAsaasPaymentStatus("PAYMENT_OVERDUE")).toBe("failed");
    expect(resolveAsaasPaymentStatus("PAYMENT_DELETED")).toBe("failed");
    expect(resolveAsaasPaymentStatus("PAYMENT_REFUNDED")).toBe("failed");
  });

  it("evento desconhecido sem status de cobrança fica pending (nunca falso-positivo de pago)", () => {
    expect(resolveAsaasPaymentStatus("PAYMENT_UPDATED")).toBe("pending");
    expect(resolveAsaasPaymentStatus("")).toBe("pending");
  });

  it("status da cobrança (consulta direta) também resolve corretamente", () => {
    expect(resolveAsaasPaymentStatus("", "RECEIVED")).toBe("paid");
    expect(resolveAsaasPaymentStatus("", "CONFIRMED")).toBe("paid");
    expect(resolveAsaasPaymentStatus("", "OVERDUE")).toBe("failed");
    expect(resolveAsaasPaymentStatus("", "PENDING")).toBe("pending");
  });
});
