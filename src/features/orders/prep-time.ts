export interface PrepTimeOrder {
  created_at: string;
  confirmed_at: string | null;
  prep_minutes: number;
}

/** Referência: o preparo "começa a contar" quando o restaurante confirma; antes disso, usa o horário do pedido. */
export function getEstimatedReadyAtMs(order: PrepTimeOrder): number {
  const reference = order.confirmed_at ?? order.created_at;
  return new Date(reference).getTime() + order.prep_minutes * 60000;
}

export interface PrepCountdown {
  label: string;
  isLate: boolean;
}

export function formatPrepCountdown(estimatedReadyAtMs: number, nowMs: number): PrepCountdown {
  const diffMin = Math.round((estimatedReadyAtMs - nowMs) / 60000);
  if (diffMin > 1) return { label: `Pronto em ~${diffMin} min`, isLate: false };
  if (diffMin >= 0) return { label: "Pronto a qualquer momento", isLate: false };
  return { label: `Atrasado ${Math.abs(diffMin)} min`, isLate: true };
}

/** Há quanto tempo o pedido chegou (contador crescente, independente do tempo de preparo). */
export function formatElapsed(createdAt: string, nowMs: number): string {
  const diffMin = Math.max(0, Math.floor((nowMs - new Date(createdAt).getTime()) / 60000));
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `há ${hours}h${mins > 0 ? ` ${mins}min` : ""}`;
}
