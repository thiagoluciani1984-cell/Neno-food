import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { OrderWithItems } from "@/types/database.types";

const ACTIVE_STATUSES = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
];

export async function getActiveOrders(
  restaurantId: string
): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurantId)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true });

  return (data ?? []) as OrderWithItems[];
}
