"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChefHat,
  Home,
  Loader2,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { createClient, getRealtimeAuthReady } from "@/infra/supabase/client";
import { ORDER_STATUS_LABEL } from "@/core/domain/value-objects/order-status";
import { timelineLineMotion, timelineStepMotion } from "@/lib/motion/nenos-motion";
import type { OrderStatus, OrderType } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { PrepCountdownBadge } from "./prep-countdown-badge";

const DELIVERY_STEPS: { status: OrderStatus; label: string; icon: typeof ChefHat }[] = [
  { status: "received", label: "Confirmado", icon: CheckCircle2 },
  { status: "preparing", label: "Preparando", icon: ChefHat },
  { status: "ready", label: "Pronto", icon: Package },
  { status: "out_for_delivery", label: "A caminho", icon: Truck },
  { status: "delivered", label: "Entregue", icon: Home },
];

const PICKUP_STEPS: { status: OrderStatus; label: string; icon: typeof ChefHat }[] = [
  { status: "received", label: "Confirmado", icon: CheckCircle2 },
  { status: "preparing", label: "Preparando", icon: ChefHat },
  { status: "ready", label: "Pronto", icon: Package },
  { status: "delivered", label: "Retirado", icon: Home },
];

export function OrderTracker({
  orderId,
  initialStatus,
  orderType = "delivery",
  createdAt,
  initialConfirmedAt,
  prepMinutes,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  orderType?: OrderType;
  createdAt: string;
  initialConfirmedAt: string | null;
  prepMinutes: number;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(initialConfirmedAt);
  const trackSteps = orderType === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void getRealtimeAuthReady().then(() => {
      if (cancelled) return;
      channel = supabase
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
            const row = payload.new as { status: OrderStatus; confirmed_at: string | null };
            setStatus(row.status);
            setConfirmedAt(row.confirmed_at);
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        <XCircle className="h-6 w-6" />
        <div>
          <p className="font-bold">Pedido cancelado</p>
          <p className="text-sm">Entre em contato com o restaurante.</p>
        </div>
      </div>
    );
  }

  if (status === "payment_pending") {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <Loader2 className="h-6 w-6 animate-spin" />
        <div>
          <p className="font-bold">{ORDER_STATUS_LABEL.payment_pending}</p>
          <p className="text-sm text-amber-800/80">
            Assim que o pagamento for confirmado, o restaurante receberá seu pedido.
          </p>
        </div>
      </div>
    );
  }

  const rawIndex = trackSteps.findIndex((s) => s.status === status);
  const activeIndex =
    rawIndex >= 0 ? rawIndex : status === "confirmed" ? 0 : 0;

  return (
    <div className="overflow-x-auto rounded-3xl border border-orange-100 bg-white p-5 shadow-sm scrollbar-hide">
      <div className="flex min-w-[520px] items-start justify-between gap-1">
        {trackSteps.map((step, i) => {
          const isActive = i === activeIndex;
          const isCompleted = i < activeIndex;
          const Icon = step.icon;
          const label = ORDER_STATUS_LABEL[step.status] ?? step.label;

          return (
            <div key={`${step.status}-${i}`} className="flex flex-1 flex-col items-center">
              <div className="relative flex w-full items-center justify-center">
                {i > 0 && (
                  <div className="absolute right-1/2 top-6 h-1 w-full -translate-y-1/2 rounded-full bg-orange-100">
                    <motion.div
                      className="h-full w-full origin-left rounded-full bg-primary"
                      variants={timelineLineMotion}
                      initial="inactive"
                      animate={i <= activeIndex ? "active" : "inactive"}
                    />
                  </div>
                )}
                <motion.div
                  variants={timelineStepMotion}
                  animate={isActive ? "active" : isCompleted ? "completed" : "inactive"}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2",
                      isActive &&
                        "border-primary bg-white text-primary shadow-md shadow-primary/25",
                      isCompleted && "border-primary bg-primary text-white",
                      !isActive &&
                        !isCompleted &&
                        "border-orange-100 bg-orange-50 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "max-w-[72px] text-center text-xs font-medium leading-tight",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-primary">
        {ORDER_STATUS_LABEL[status]}
      </p>
      {(status === "received" || status === "confirmed" || status === "preparing") && (
        <div className="mt-2 flex justify-center">
          <PrepCountdownBadge
            order={{ created_at: createdAt, confirmed_at: confirmedAt, prep_minutes: prepMinutes }}
          />
        </div>
      )}
    </div>
  );
}
