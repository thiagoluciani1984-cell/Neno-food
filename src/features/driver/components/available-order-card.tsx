"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MapPin, Store, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { acceptOrderAction } from "../actions";
import type { AvailableOrder } from "../queries";

interface AvailableOrderCardProps {
  order: AvailableOrder;
}

export function AvailableOrderCard({ order }: AvailableOrderCardProps) {
  const [pending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptOrderAction(order.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Pedido aceito! Vá buscar no restaurante.");
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-muted-foreground">#{order.order_number}</span>
          <span className="font-bold text-primary">{formatBRL(order.delivery_fee_cents)}</span>
        </div>

        <div className="flex items-start gap-2">
          <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Retirar em</p>
            <p className="text-sm font-semibold">{order.restaurant_name}</p>
            {order.restaurant_address && (
              <p className="text-xs text-foreground/70">{order.restaurant_address}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Entregar para</p>
            <p className="text-sm font-semibold">{order.customer_name}</p>
            <p className="text-xs text-foreground/70">{order.delivery_address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          {order.items_count} {order.items_count === 1 ? "item" : "itens"} ·{" "}
          {formatBRL(order.total_cents)} no total
        </div>

        <Button className="w-full" onClick={handleAccept} disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Aceitar entrega
        </Button>
      </div>
    </div>
  );
}
