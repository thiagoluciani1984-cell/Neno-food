"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Clock, Bike, ShoppingBag } from "lucide-react";
import { createClient } from "@/infra/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/money";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  nextStatuses,
} from "@/core/domain/value-objects/order-status";
import { updateOrderStatusAction } from "@/features/orders/actions";
import { PrepCountdownBadge } from "@/features/orders/components/prep-countdown-badge";
import { playNewOrderChime } from "@/lib/sound";
import type { OrderStatus, OrderWithItems } from "@/types/database.types";

const COLUMNS: OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
];

export function OrdersBoard({
  restaurantId,
  initialOrders,
}: {
  restaurantId: string;
  initialOrders: OrderWithItems[];
}) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);

  const fetchOrder = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_options(*))")
      .eq("id", id)
      .single<OrderWithItems>();
    return data;
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const row = payload.new as OrderWithItems;
          if (payload.eventType === "INSERT") {
            const full = await fetchOrder(row.id);
            if (full) {
              setOrders((prev) => [...prev, full]);
              playNewOrderChime();
              toast.success(`Novo pedido #${full.order_number}!`, {
                description: full.customer_name ?? undefined,
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const terminal = row.status === "delivered" || row.status === "cancelled";
            setOrders((prev) =>
              terminal
                ? prev.filter((o) => o.id !== row.id)
                : prev.map((o) => (o.id === row.id ? { ...o, ...row } : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrder]);

  async function advance(order: OrderWithItems, status: OrderStatus) {
    const res = await updateOrderStatusAction(order.id, status);
    if (!res.ok) toast.error(res.error ?? "Erro ao atualizar.");
  }

  return (
    <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colOrders = orders.filter((o) => o.status === col);
        return (
          <div key={col} className="min-w-[280px] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-semibold">{ORDER_STATUS_LABEL[col]}</h2>
              <Badge variant="secondary">{colOrders.length}</Badge>
            </div>

            <div className="space-y-3">
              {colOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-primary">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">#{order.order_number}</span>
                      <Badge variant="outline" className={ORDER_STATUS_COLOR[order.status]}>
                        {order.type === "delivery" ? (
                          <Bike className="mr-1 h-3 w-3" />
                        ) : (
                          <ShoppingBag className="mr-1 h-3 w-3" />
                        )}
                        {order.type === "delivery" ? "Entrega" : "Retirada"}
                      </Badge>
                    </div>

                    {(order.status === "received" ||
                      order.status === "confirmed" ||
                      order.status === "preparing") && <PrepCountdownBadge order={order} />}

                    <div className="text-sm">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-muted-foreground">{order.customer_phone}</p>
                    </div>

                    <Separator />

                    <ul className="space-y-1 text-sm">
                      {order.order_items.map((item) => (
                        <li key={item.id}>
                          <div className="flex justify-between">
                            <span>
                              {item.quantity}× {item.product_name}
                            </span>
                            <span className="text-muted-foreground">
                              {formatBRL(item.total_cents)}
                            </span>
                          </div>
                          {item.order_item_options?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {item.order_item_options
                                .map((o) =>
                                  o.quantity > 1
                                    ? `${o.option_item_name} (${o.quantity}x)`
                                    : o.option_item_name
                                )
                                .join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>

                    {order.notes && (
                      <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                        Obs.: {order.notes}
                      </p>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="font-bold text-primary">
                        {formatBRL(order.total_cents)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {nextStatuses(order.status).map((ns) => (
                        <Button
                          key={ns}
                          size="sm"
                          variant={ns === "cancelled" ? "outline" : "default"}
                          className={ns === "cancelled" ? "text-destructive" : ""}
                          onClick={() => advance(order, ns)}
                        >
                          {ORDER_STATUS_LABEL[ns]}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {colOrders.length === 0 && (
                <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Vazio
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
