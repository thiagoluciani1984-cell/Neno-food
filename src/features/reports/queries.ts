import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { Order, PaymentMethod } from "@/types/database.types";

export interface ReportSummary {
  revenue: number;
  orderCount: number;
  avgTicket: number;
  cancelledCount: number;
  byPayment: [PaymentMethod, number][];
  byType: { delivery: number; pickup: number };
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export async function getReportSummary(
  restaurantId: string,
  days = 30
): Promise<ReportSummary> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_cents, payment_method, status, type, created_at")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", since.toISOString()),
    supabase
      .from("order_items")
      .select("product_name, quantity, total_cents, orders!inner(restaurant_id, created_at, status)")
      .eq("orders.restaurant_id", restaurantId)
      .neq("orders.status", "cancelled")
      .gte("orders.created_at", since.toISOString()),
  ]);

  const allOrders = (orders ?? []) as Pick<
    Order,
    "id" | "total_cents" | "payment_method" | "status" | "type" | "created_at"
  >[];

  const valid = allOrders.filter((o) => o.status !== "cancelled");
  const cancelledCount = allOrders.length - valid.length;
  const revenue = valid.reduce((s, o) => s + o.total_cents, 0);
  const orderCount = valid.length;
  const avgTicket = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  const byPayment = new Map<PaymentMethod, number>();
  for (const o of valid) {
    byPayment.set(o.payment_method, (byPayment.get(o.payment_method) ?? 0) + o.total_cents);
  }

  const byType = { delivery: 0, pickup: 0 };
  for (const o of valid) {
    if (o.type === "delivery") byType.delivery += 1;
    else byType.pickup += 1;
  }

  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of valid) {
    const date = o.created_at.slice(0, 10);
    const cur = dailyMap.get(date) ?? { revenue: 0, orders: 0 };
    dailyMap.set(date, {
      revenue: cur.revenue + o.total_cents,
      orders: cur.orders + 1,
    });
  }

  const dailyRevenue = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const productMap = new Map<string, { quantity: number; revenue: number }>();
  for (const item of items ?? []) {
    const name = item.product_name as string;
    const cur = productMap.get(name) ?? { quantity: 0, revenue: 0 };
    productMap.set(name, {
      quantity: cur.quantity + (item.quantity as number),
      revenue: cur.revenue + (item.total_cents as number),
    });
  }

  const topProducts = [...productMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    revenue,
    orderCount,
    avgTicket,
    cancelledCount,
    byPayment: [...byPayment.entries()],
    byType,
    dailyRevenue,
    topProducts,
  };
}
