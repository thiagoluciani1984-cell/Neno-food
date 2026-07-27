import { describe, it, expect } from "vitest";
import { canTransition, isTerminal, nextStatuses } from "./order-status";

describe("canTransition", () => {
  it("permite o fluxo feliz completo, passo a passo", () => {
    expect(canTransition("payment_pending", "received")).toBe(true);
    expect(canTransition("received", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "preparing")).toBe(true);
    expect(canTransition("preparing", "ready")).toBe(true);
    expect(canTransition("ready", "out_for_delivery")).toBe(true);
    expect(canTransition("out_for_delivery", "delivered")).toBe(true);
  });

  it("permite retirada pular direto de ready pra delivered", () => {
    expect(canTransition("ready", "delivered")).toBe(true);
  });

  it("bloqueia pular etapas (received -> ready)", () => {
    expect(canTransition("received", "ready")).toBe(false);
  });

  it("bloqueia voltar etapas (preparing -> received)", () => {
    expect(canTransition("preparing", "received")).toBe(false);
  });

  it("bloqueia qualquer transição a partir de estados terminais", () => {
    expect(canTransition("delivered", "received")).toBe(false);
    expect(canTransition("cancelled", "received")).toBe(false);
  });

  it("permite cancelar em qualquer etapa não-terminal", () => {
    expect(canTransition("payment_pending", "cancelled")).toBe(true);
    expect(canTransition("preparing", "cancelled")).toBe(true);
    expect(canTransition("out_for_delivery", "cancelled")).toBe(true);
  });
});

describe("isTerminal", () => {
  it("delivered e cancelled são terminais", () => {
    expect(isTerminal("delivered")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
  });

  it("estados intermediários não são terminais", () => {
    expect(isTerminal("preparing")).toBe(false);
    expect(isTerminal("out_for_delivery")).toBe(false);
  });
});

describe("nextStatuses", () => {
  it("lista as próximas transições válidas de um estado", () => {
    expect(nextStatuses("ready")).toEqual(["out_for_delivery", "delivered", "cancelled"]);
  });

  it("estado terminal não tem próximas transições", () => {
    expect(nextStatuses("delivered")).toEqual([]);
  });
});
