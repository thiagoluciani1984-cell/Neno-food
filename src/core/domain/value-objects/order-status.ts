import type { OrderStatus } from "@/types/database.types";

/**
 * Máquina de estados do pedido. Centraliza transições válidas e rótulos.
 */
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  payment_pending: ["received", "cancelled"],
  received: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  payment_pending: "Aguardando pagamento",
  received: "Recebido",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  payment_pending: "bg-slate-100 text-slate-800 border-slate-200",
  received: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-indigo-100 text-indigo-800 border-indigo-200",
  preparing: "bg-amber-100 text-amber-800 border-amber-200",
  ready: "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_FLOW[from]?.includes(to) ?? false;
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_FLOW[from] ?? [];
}

export function isTerminal(status: OrderStatus): boolean {
  return ORDER_STATUS_FLOW[status]?.length === 0;
}
