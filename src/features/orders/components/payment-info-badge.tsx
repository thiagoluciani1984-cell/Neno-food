import { CheckCircle2, Banknote } from "lucide-react";
import { formatBRL } from "@/lib/money";
import type { PaymentMethod, PaymentStatus } from "@/types/database.types";

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão (maquininha)",
  online: "PIX ou cartão online",
};

export function PaymentInfoBadge({
  order,
}: {
  order: {
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    change_for_cents: number | null;
    total_cents: number;
  };
}) {
  const alreadyPaid = order.payment_method === "online" && order.payment_status === "paid";

  if (alreadyPaid) {
    return (
      <p className="flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Já pago pela plataforma — não cobrar
      </p>
    );
  }

  const troco =
    order.payment_method === "cash" && order.change_for_cents
      ? Math.max(0, order.change_for_cents - order.total_cents)
      : null;

  return (
    <p className="flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
      <Banknote className="h-3 w-3" />
      Cobrar na entrega: {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
      {troco !== null && ` (levar troco de ${formatBRL(troco)})`}
    </p>
  );
}
