import "server-only";
import { createClient } from "@/infra/supabase/server";
import { createAdminClient } from "@/infra/supabase/admin";
import type { OrderWithItems, Restaurant } from "@/types/database.types";

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
    .select("*, order_items(*, order_item_options(*))")
    .eq("restaurant_id", restaurantId)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true });

  return (data ?? []) as OrderWithItems[];
}

type OrderDetail = OrderWithItems & {
  restaurants: Pick<Restaurant, "id" | "name" | "slug" | "logo_url"> | null;
};

/** Busca pedido para rastreamento (autenticado via RLS ou token de convidado). */
export async function getOrderForTracking(
  orderId: string,
  guestToken?: string
): Promise<OrderDetail | null> {
  const select = `
    *,
    order_items(*, order_item_options(*)),
    restaurants(id, name, slug, logo_url)
  `;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(select)
    .eq("id", orderId)
    .maybeSingle<OrderDetail>();

  if (order) return order;

  if (!guestToken) return null;

  const admin = createAdminClient();
  const { data: guestOrder } = await admin
    .from("orders")
    .select(select)
    .eq("id", orderId)
    .eq("guest_access_token", guestToken)
    .maybeSingle<OrderDetail>();

  return guestOrder;
}
