import { describe, it, expect } from "vitest";
import { isPastClosingTime, type OpeningHours } from "./opening-hours";

const BASE_HOURS: OpeningHours = {
  dom: { enabled: false, open: "11:00", close: "22:00" },
  seg: { enabled: true, open: "11:00", close: "22:00" },
  ter: { enabled: true, open: "11:00", close: "22:00" },
  qua: { enabled: true, open: "11:00", close: "22:00" },
  qui: { enabled: true, open: "11:00", close: "22:00" },
  sex: { enabled: true, open: "11:00", close: "23:00" },
  sab: { enabled: true, open: "11:00", close: "23:00" },
};

// America/Sao_Paulo é UTC-3 (sem horário de verão desde 2019).
function utcForSaoPaulo(isoLocal: string): Date {
  return new Date(`${isoLocal}-03:00`);
}

describe("isPastClosingTime", () => {
  it("não fechou: horário atual antes do close de hoje", () => {
    // Segunda-feira, 20:00 (fecha 22:00)
    const now = utcForSaoPaulo("2026-07-27T20:00:00");
    expect(isPastClosingTime(BASE_HOURS, now)).toBe(false);
  });

  it("fechou: horário atual depois do close de hoje", () => {
    // Segunda-feira, 22:30 (fecha 22:00)
    const now = utcForSaoPaulo("2026-07-27T22:30:00");
    expect(isPastClosingTime(BASE_HOURS, now)).toBe(true);
  });

  it("dia desabilitado: nunca considera fechamento automático", () => {
    // Domingo (dom.enabled = false), qualquer horário
    const now = utcForSaoPaulo("2026-07-26T23:59:00");
    expect(isPastClosingTime(BASE_HOURS, now)).toBe(false);
  });

  it("expediente que atravessa meia-noite: ainda aberto logo após virar o dia", () => {
    const overnight: OpeningHours = {
      ...BASE_HOURS,
      sex: { enabled: true, open: "18:00", close: "02:00" },
      sab: { enabled: true, open: "18:00", close: "02:00" },
    };
    // Sábado 00:30 (madrugada), expediente de sexta ainda rolando até as 02:00
    const now = utcForSaoPaulo("2026-08-01T00:30:00");
    expect(isPastClosingTime(overnight, now)).toBe(false);
  });

  it("expediente que atravessa meia-noite: fechou depois do close do dia seguinte", () => {
    const overnight: OpeningHours = {
      ...BASE_HOURS,
      sex: { enabled: true, open: "18:00", close: "02:00" },
      sab: { enabled: true, open: "18:00", close: "02:00" },
    };
    // Sábado 03:00 (madrugada), já passou do close (02:00) do expediente de sexta
    const now = utcForSaoPaulo("2026-08-01T03:00:00");
    expect(isPastClosingTime(overnight, now)).toBe(true);
  });
});
