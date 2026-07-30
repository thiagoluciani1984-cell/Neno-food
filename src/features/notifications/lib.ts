import "server-only";
import { createAdminClient } from "@/infra/supabase/admin";
import { ORDER_STATUS_LABEL } from "@/core/domain/value-objects/order-status";
import type { OrderStatus } from "@/types/database.types";

export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: OrderStatus
): Promise<void> {
  if (newStatus === "payment_pending") return;

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, customer_id, customers(profile_id)")
    .eq("id", orderId)
    .single<{
      order_number: number;
      customer_id: string | null;
      customers: { profile_id: string } | null;
    }>();

  const profileId = order?.customers?.profile_id;
  if (!profileId) return;

  await supabase.from("notifications").insert({
    user_id: profileId,
    type: "order_update",
    title: `Pedido #${order.order_number}`,
    body: ORDER_STATUS_LABEL[newStatus],
    payload: { order_id: orderId, status: newStatus },
  });
}

/** Avisa todo master_admin quando um lançamento de insumo aguarda aprovação. */
export async function notifySupplyEntryPending(
  entry: { id: string; item_name: string; quantity: number; unit_type: string },
  restaurantName: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "master_admin");

  if (!admins || admins.length === 0) return;

  const qty = entry.unit_type === "kg" ? `${entry.quantity}kg` : `${entry.quantity}x`;

  await supabase.from("notifications").insert(
    admins.map((admin) => ({
      user_id: admin.id,
      type: "system" as const,
      title: "Novo insumo lançado",
      body: `${restaurantName}: ${entry.item_name} (${qty}) aguardando aprovação`,
      payload: { kind: "supply_entry", entry_id: entry.id },
    }))
  );
}

/** Avisa o dono/equipe do restaurante quando um insumo do estoque cruza o mínimo. */
export async function notifyLowStock(
  restaurantId: string,
  item: { id: string; name: string; current_quantity: number; unit_type: string }
): Promise<void> {
  const supabase = createAdminClient();

  const { data: staff } = await supabase
    .from("profiles")
    .select("id")
    .eq("restaurant_id", restaurantId);

  if (!staff || staff.length === 0) return;

  await supabase.from("notifications").insert(
    staff.map((p) => ({
      user_id: p.id,
      type: "system" as const,
      title: "Estoque baixo",
      body: `${item.name}: só ${item.current_quantity}${item.unit_type} restando`,
      payload: { kind: "stock_low", item_id: item.id },
    }))
  );
}
