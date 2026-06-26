"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MapPin, Package, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { completeDeliveryAction } from "../actions";
import type { Order, DeliveryAddressSnapshot } from "@/types/database.types";

function formatAddress(addr: DeliveryAddressSnapshot | string | null): string {
  if (!addr) return "Endereço não informado";
  if (typeof addr === "string") return addr;
  return `${addr.street}, ${addr.number}${addr.complement ? ` – ${addr.complement}` : ""}, ${addr.district}, ${addr.city}`;
}

interface ActiveOrderCardProps {
  order: Order;
}

export function ActiveOrderCard({ order }: ActiveOrderCardProps) {
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    if (!confirm("Confirmar entrega do pedido #" + order.order_number + "?")) return;
    startTransition(async () => {
      const result = await completeDeliveryAction(order.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Entrega concluída! Ótimo trabalho.");
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-primary/40 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-bold text-primary">Entrega em andamento</span>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          #{order.order_number}
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* Destino */}
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Entregar para</p>
            <p className="font-semibold">{order.customer_name}</p>
            <p className="text-sm text-foreground/80">
              {formatAddress(order.delivery_address)}
            </p>
          </div>
        </div>

        {/* Valor */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">Total do pedido</span>
          <span className="font-bold">{formatBRL(order.total_cents)}</span>
        </div>

        {/* Botão de concluir */}
        <Button
          className="w-full gap-2"
          onClick={handleComplete}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Confirmar entrega
        </Button>
      </div>
    </div>
  );
}
