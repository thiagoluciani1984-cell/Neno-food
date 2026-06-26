"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { createClient } from "@/infra/supabase/client";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_FLOW,
} from "@/core/domain/value-objects/order-status";
import type { OrderStatus } from "@/types/database.types";

const TRACK_STEPS: OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export function OrderTracker({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);

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

  const currentIndex = TRACK_STEPS.indexOf(status);

  return (
    <div className="space-y-1">
      {TRACK_STEPS.map((step, i) => {
        const done = i <= currentIndex;
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
              {ORDER_STATUS_LABEL[step]}
            </span>
          </div>
        );
      })}
      {/* status final implícito */}
      {ORDER_STATUS_FLOW[status]?.length === 0 && status === "delivered" && (
        <p className="pt-2 text-sm text-primary">Pedido entregue. Bom apetite! 🍝</p>
      )}
    </div>
  );
}
