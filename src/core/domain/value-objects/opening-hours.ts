export interface DaySchedule {
  enabled: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export type OpeningHours = Record<string, DaySchedule>;

/** dom=0 (Domingo) .. sab=6 (Sábado), igual ao Date#getDay(). */
const DAY_KEYS_BY_INDEX = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

const TIMEZONE = "America/Sao_Paulo";

/** Dia da semana (chave) e horário "HH:MM" atuais no fuso do restaurante, sem depender de libs externas. */
export function getLocalDayAndTime(now: Date): { dayKey: string; hhmm: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayShort);
  const dayKey = DAY_KEYS_BY_INDEX[weekdayIndex < 0 ? 0 : weekdayIndex];
  // Meia-noite pode vir como "24:00" no formato en-US hour12:false — normaliza pra "00:00".
  const normalizedHour = hour === "24" ? "00" : hour;

  return { dayKey, hhmm: `${normalizedHour}:${minute}` };
}

function dayBefore(dayKey: string): string {
  const idx = DAY_KEYS_BY_INDEX.indexOf(dayKey as (typeof DAY_KEYS_BY_INDEX)[number]);
  return DAY_KEYS_BY_INDEX[(idx + 6) % 7];
}

/**
 * O restaurante está marcado como aberto, mas já passou do horário de
 * fechamento configurado? Considera também o expediente do dia anterior
 * quando ele atravessa a meia-noite (ex.: abre 18:00, fecha 01:00).
 */
export function isPastClosingTime(openingHours: OpeningHours, now: Date = new Date()): boolean {
  const { dayKey, hhmm } = getLocalDayAndTime(now);

  const yesterdayKey = dayBefore(dayKey);
  const yesterday = openingHours[yesterdayKey];
  const today = openingHours[dayKey];
  const yesterdayWasOvernight = !!yesterday?.enabled && yesterday.close <= yesterday.open;

  if (yesterdayWasOvernight && hhmm < yesterday.close) {
    // Expediente de ontem atravessou a meia-noite e ainda está rolando.
    return false;
  }

  if (yesterdayWasOvernight && (!today?.enabled || hhmm < today.open)) {
    // Expediente de ontem (que atravessou a meia-noite) já fechou, e
    // hoje ainda não abriu (ou não tem expediente hoje).
    return true;
  }

  if (!today?.enabled) return false;

  if (today.close <= today.open) {
    // Expediente de hoje atravessa a meia-noite: só "fechado" na madrugada
    // seguinte (tratado no dia seguinte via checagem de "ontem" acima).
    return false;
  }

  return hhmm >= today.close;
}
