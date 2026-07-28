export interface Shift {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface DaySchedule {
  enabled: boolean;
  shifts: Shift[]; // 1 turno (ex.: só jantar) ou 2 (ex.: almoço + jantar)
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

function isOvernight(shift: Shift): boolean {
  return shift.close <= shift.open;
}

/** hhmm ainda está dentro de um turno de ONTEM que atravessou a meia-noite. */
function isWithinYesterdayOvernightShift(shift: Shift, hhmm: string): boolean {
  return isOvernight(shift) && hhmm < shift.close;
}

/**
 * O restaurante está marcado como aberto, mas já passou do fim do ÚLTIMO
 * turno configurado pra hoje? Um intervalo entre dois turnos do mesmo dia
 * (ex.: fechou o almoço às 15h, abre o jantar às 18h) NÃO conta como
 * "fechamento" — só fecha de fato depois que não sobra mais nenhum turno
 * pela frente hoje (nem um turno de ontem que atravessou a meia-noite e
 * ainda está rolando). Isso evita ter que reabrir sozinho a cada turno:
 * uma vez aberto, só fecha quando o dia realmente termina ou não há
 * expediente configurado.
 */
export function isPastClosingTime(openingHours: OpeningHours, now: Date = new Date()): boolean {
  const { dayKey, hhmm } = getLocalDayAndTime(now);

  const yesterdayKey = dayBefore(dayKey);
  const yesterday = openingHours[yesterdayKey];
  const today = openingHours[dayKey];

  const yesterdayShifts = yesterday?.enabled ? (yesterday.shifts ?? []) : [];
  const todayShifts = today?.enabled ? (today.shifts ?? []) : [];
  const yesterdayOvernightShifts = yesterdayShifts.filter(isOvernight);

  // Ainda dentro de um turno de ontem que atravessou a meia-noite?
  if (yesterdayOvernightShifts.some((s) => isWithinYesterdayOvernightShift(s, hhmm))) {
    return false;
  }

  if (todayShifts.length === 0) {
    // Sem expediente hoje: só fecha se vinha de um turno de ontem que
    // atravessa a meia-noite (já confirmado acima que ele já terminou).
    return yesterdayOvernightShifts.length > 0;
  }

  // Ainda sobra algum turno hoje? Um turno que atravessa a meia-noite
  // conta como "ainda pela frente" mesmo antes de começar — ele só vira
  // "passado" quando checado no dia seguinte (ramo acima).
  const stillHasShiftAheadToday = todayShifts.some(
    (s) => isOvernight(s) || hhmm < s.close
  );

  return !stillHasShiftAheadToday;
}
