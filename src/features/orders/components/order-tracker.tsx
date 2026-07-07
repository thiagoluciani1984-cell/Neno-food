"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { createClient } from "@/infra/supabase/client";
import { ORDER_STATUS_LABEL } from "@/core/domain/value-objects/order-status";
import type { OrderStatus, OrderType } from "@/types/database.types";

const DELIVERY_STEPS: OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

const PICKUP_STEPS: OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

export function OrderTracker({
  orderId,
  initialStatus,
  orderType = "delivery",
}: {
  orderId: string;
  initialStatus: OrderStatus;
  orderType?: OrderType;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const trackSteps = orderType === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = (payload.new as { status: OrderStatus }).status;
          setStatus(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        <XCircle className="h-6 w-6" />
        <div>
          <p className="font-semibold">Pedido cancelado</p>
          <p className="text-sm">Entre em contato com o restaurante.</p>
        </div>
      </div>
    );
  }

  if (status === "payment_pending") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <Loader2 className="h-6 w-6 animate-spin" />
        <div>
          <p className="font-semibold">{ORDER_STATUS_LABEL.payment_pending}</p>
          <p className="text-sm text-amber-800/80">
            Assim que o pagamento for confirmado, o restaurante receberá seu pedido.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = trackSteps.indexOf(status);

  return (
    <div className="space-y-1">
      {trackSteps.map((step, i) => {
        const done = currentIndex >= 0 && i <= currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex items-center gap-3 py-2">
            {done ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground/40" />
            )}
            <span
              className={
                active
                  ? "font-semibold text-primary"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground"
              }
            >
              {step === "delivered" && orderType === "pickup"
                ? "Retirado"
                : ORDER_STATUS_LABEL[step]}
            </span>
          </div>
        );
      })}
      {status === "delivered" && (
        <p className="pt-2 text-sm text-primary">
          {orderType === "pickup"
            ? "Pedido retirado. Bom apetite!"
            : "Pedido entregue. Bom apetite!"}
        </p>
      )}
    </div>
  );
}
