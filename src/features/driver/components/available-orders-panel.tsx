"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bike } from "lucide-react";
import { createClient } from "@/infra/supabase/client";
import { SoundToggle } from "@/components/shared/sound-toggle";
import { playDeliveryAlert } from "@/lib/sound";
import { getAvailableOrdersAction } from "../actions";
import { AvailableOrderCard } from "./available-order-card";
import type { AvailableOrder } from "../queries";

const POLL_INTERVAL_MS = 20000;

export function AvailableOrdersPanel({ initialOrders }: { initialOrders: AvailableOrder[] }) {
  const [orders, setOrders] = useState<AvailableOrder[]>(initialOrders);
  const knownIdsRef = useRef(new Set(initialOrders.map((o) => o.id)));

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const next = await getAvailableOrdersAction();
      if (cancelled) return;

      const newOnes = next.filter((o) => !knownIdsRef.current.has(o.id));
      knownIdsRef.current = new Set(next.map((o) => o.id));
      setOrders(next);

      if (newOnes.length === 1) {
        playDeliveryAlert();
        toast.success(`Nova corrida disponível! #${newOnes[0].order_number}`, {
          description: newOnes[0].restaurant_name,
        });
      } else if (newOnes.length > 1) {
        playDeliveryAlert();
        toast.success(`${newOnes.length} novas corridas disponíveis!`);
      }
    }

    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);

    const supabase = createClient();
    const channel = supabase
      .channel("driver-available-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: "status=eq.ready" },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">
          Pedidos disponíveis
          {orders.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {orders.length}
            </span>
          )}
        </h2>
        <SoundToggle />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border bg-white py-10 text-center">
          <Bike className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum pedido disponível no momento.</p>
          <p className="text-xs text-muted-foreground">Fique online e aguarde!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <AvailableOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
