import { describe, it, expect } from "vitest";
import { isPastClosingTime, type OpeningHours } from "./opening-hours";

const BASE_HOURS: OpeningHours = {
  dom: { enabled: false, shifts: [{ open: "11:00", close: "22:00" }] },
  seg: { enabled: true, shifts: [{ open: "11:00", close: "22:00" }] },
  ter: { enabled: true, shifts: [{ open: "11:00", close: "22:00" }] },
  qua: { enabled: true, shifts: [{ open: "11:00", close: "22:00" }] },
  qui: { enabled: true, shifts: [{ open: "11:00", close: "22:00" }] },
  sex: { enabled: true, shifts: [{ open: "11:00", close: "23:00" }] },
  sab: { enabled: true, shifts: [{ open: "11:00", close: "23:00" }] },
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

  it("turno noturno: ainda aberto logo após virar o dia", () => {
    const overnight: OpeningHours = {
      ...BASE_HOURS,
      sex: { enabled: true, shifts: [{ open: "18:00", close: "02:00" }] },
      sab: { enabled: true, shifts: [{ open: "18:00", close: "02:00" }] },
    };
    // Sábado 00:30 (madrugada), expediente de sexta ainda rolando até as 02:00
    const now = utcForSaoPaulo("2026-08-01T00:30:00");
    expect(isPastClosingTime(overnight, now)).toBe(false);
  });

  it("turno noturno recorrente: continua aberto no intervalo antes do turno de hoje começar", () => {
    const overnight: OpeningHours = {
      ...BASE_HOURS,
      sex: { enabled: true, shifts: [{ open: "18:00", close: "02:00" }] },
      sab: { enabled: true, shifts: [{ open: "18:00", close: "02:00" }] },
    };
    // Sábado 10:00 — turno de sexta já fechou (02:00), mas hoje (sábado)
    // também abre à noite, então não deve ser tratado como "fechado".
    const now = utcForSaoPaulo("2026-08-01T10:00:00");
    expect(isPastClosingTime(overnight, now)).toBe(false);
  });

  it("turno noturno: fecha de verdade quando o dia seguinte está desabilitado (folga)", () => {
    const overnight: OpeningHours = {
      ...BASE_HOURS,
      sex: { enabled: true, shifts: [{ open: "18:00", close: "02:00" }] },
      sab: { enabled: false, shifts: [{ open: "18:00", close: "02:00" }] },
    };
    // Sábado 10:00, mas sábado é folga — o turno de sexta já encerrou de vez.
    const now = utcForSaoPaulo("2026-08-01T10:00:00");
    expect(isPastClosingTime(overnight, now)).toBe(true);
  });

  it("dois turnos (almoço + jantar): NÃO fecha no intervalo entre eles", () => {
    const twoShifts: OpeningHours = {
      ...BASE_HOURS,
      seg: {
        enabled: true,
        shifts: [
          { open: "11:00", close: "15:00" },
          { open: "18:00", close: "23:00" },
        ],
      },
    };
    // Segunda 16:00 — entre o almoço e o jantar, mas o jantar ainda vem hoje.
    const now = utcForSaoPaulo("2026-07-27T16:00:00");
    expect(isPastClosingTime(twoShifts, now)).toBe(false);
  });

  it("dois turnos: aberto durante o turno do almoço", () => {
    const twoShifts: OpeningHours = {
      ...BASE_HOURS,
      seg: {
        enabled: true,
        shifts: [
          { open: "11:00", close: "15:00" },
          { open: "18:00", close: "23:00" },
        ],
      },
    };
    const now = utcForSaoPaulo("2026-07-27T12:00:00");
    expect(isPastClosingTime(twoShifts, now)).toBe(false);
  });

  it("dois turnos: aberto durante o turno do jantar", () => {
    const twoShifts: OpeningHours = {
      ...BASE_HOURS,
      seg: {
        enabled: true,
        shifts: [
          { open: "11:00", close: "15:00" },
          { open: "18:00", close: "23:00" },
        ],
      },
    };
    const now = utcForSaoPaulo("2026-07-27T20:00:00");
    expect(isPastClosingTime(twoShifts, now)).toBe(false);
  });

  it("dois turnos: fecha de vez depois do segundo turno (jantar) terminar", () => {
    const twoShifts: OpeningHours = {
      ...BASE_HOURS,
      seg: {
        enabled: true,
        shifts: [
          { open: "11:00", close: "15:00" },
          { open: "18:00", close: "23:00" },
        ],
      },
    };
    const now = utcForSaoPaulo("2026-07-27T23:30:00");
    expect(isPastClosingTime(twoShifts, now)).toBe(true);
  });
});
