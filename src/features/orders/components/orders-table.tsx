"use client";

import { motion } from "framer-motion";
import { staggerContainer, tableRowMotion } from "@/lib/motion/nenos-motion";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/core/domain/value-objects/order-status";
import type { OrderStatus } from "@/types/database.types";

export type OrderTableRow = {
  id: string;
  order_number: number;
  customer_name: string | null;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
};

export function OrdersTable({ orders }: { orders: OrderTableRow[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pedido.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-orange-100 text-left text-xs font-semibold text-muted-foreground">
            <th className="pb-3 pr-4">Pedido</th>
            <th className="pb-3 pr-4">Cliente</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Horário</th>
            <th className="pb-3 text-right">Total</th>
          </tr>
        </thead>
        <motion.tbody variants={staggerContainer} initial="initial" animate="animate">
          {orders.map((order) => (
            <motion.tr
              key={order.id}
              variants={tableRowMotion}
              className="border-b border-orange-100 hover:bg-orange-50/60"
            >
              <td className="py-3 pr-4 font-medium">#{order.order_number}</td>
              <td className="py-3 pr-4">{order.customer_name ?? "—"}</td>
              <td className="py-3 pr-4">
                <Badge variant="outline" className={ORDER_STATUS_COLOR[order.status]}>
                  {ORDER_STATUS_LABEL[order.status]}
                </Badge>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-3 text-right font-semibold">{formatBRL(order.total_cents)}</td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
