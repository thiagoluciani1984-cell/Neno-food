import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { Order, OrderItem } from "@/types/database.types";

export interface DashboardMetrics {
  ordersToday: number;
  revenueTodayCents: number;
  avgTicketCents: number;
  inProgress: number;
  activeCustomers: number;
  topProducts: { name: string; quantity: number }[];
  recentOrders: Order[];
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getDashboardMetrics(
  restaurantId: string
): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const since = startOfToday();

  const [{ data: todayOrders }, { data: inProgressOrders }, { data: recent }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, total_cents, customer_id, status")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", since),
      supabase
        .from("orders")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .in("status", ["received", "confirmed", "preparing", "ready", "out_for_delivery"]),
      supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const valid = (todayOrders ?? []).filter((o) => o.status !== "cancelled");
  const revenueTodayCents = valid.reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const ordersToday = valid.length;
  const avgTicketCents = ordersToday > 0 ? Math.round(revenueTodayCents / ordersToday) : 0;
  const activeCustomers = new Set(
    valid.map((o) => o.customer_id).filter(Boolean)
  ).size;

  // Produtos mais vendidos (últimos 30 dias)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, quantity, orders!inner(restaurant_id, created_at)")
    .eq("orders.restaurant_id", restaurantId)
    .gte("orders.created_at", monthAgo.toISOString());

  const tally = new Map<string, number>();
  for (const it of (items ?? []) as unknown as (Pick<OrderItem, "product_name" | "quantity">)[]) {
    tally.set(it.product_name, (tally.get(it.product_name) ?? 0) + it.quantity);
  }
  const topProducts = [...tally.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    ordersToday,
    revenueTodayCents,
    avgTicketCents,
    inProgress: (inProgressOrders ?? []).length,
    activeCustomers,
    topProducts,
    recentOrders: (recent ?? []) as Order[],
  };
}
