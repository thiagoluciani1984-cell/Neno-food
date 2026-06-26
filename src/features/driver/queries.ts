import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { Driver, DriverDocument, DriverVehicle, Order } from "@/types/database.types";

export type DriverProfile = Driver & {
  vehicle: DriverVehicle | null;
  documents: DriverDocument[];
};

export async function getDriverProfile(profileId: string): Promise<DriverProfile | null> {
  const supabase = await createClient();

  const { data: driver } = await supabase
    .from("drivers")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle<Driver>();

  if (!driver) return null;

  const [{ data: vehicles }, { data: documents }] = await Promise.all([
    supabase
      .from("driver_vehicles")
      .select("*")
      .eq("driver_id", driver.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", driver.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    ...driver,
    vehicle: ((vehicles ?? []) as DriverVehicle[])[0] ?? null,
    documents: (documents ?? []) as DriverDocument[],
  };
}

export type AvailableOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  delivery_address: string;
  total_cents: number;
  delivery_fee_cents: number;
  restaurant_name: string;
  restaurant_address: string;
  items_count: number;
  created_at: string;
};

export async function getAvailableOrders(): Promise<AvailableOrder[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(`
      id, order_number, customer_name, delivery_address,
      total_cents, delivery_fee_cents, created_at,
      restaurant:restaurants!restaurant_id(name, address),
      order_items(id)
    `)
    .eq("status", "ready")
    .is("driver_id", null)
    .eq("type", "delivery")
    .order("created_at", { ascending: true })
    .limit(10);

  if (!data) return [];

  return data.map((o: any) => {
    const restaurant = Array.isArray(o.restaurant) ? o.restaurant[0] : o.restaurant;
    return {
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name ?? "",
      delivery_address: o.delivery_address
        ? typeof o.delivery_address === "string"
          ? o.delivery_address
          : `${o.delivery_address.street}, ${o.delivery_address.number}, ${o.delivery_address.district}`
        : "",
      total_cents: o.total_cents,
      delivery_fee_cents: o.delivery_fee_cents,
      restaurant_name: restaurant?.name ?? "",
      restaurant_address: restaurant?.address ?? "",
      items_count: (o.order_items ?? []).length,
      created_at: o.created_at,
    };
  });
}

export async function getActiveDelivery(driverId: string): Promise<Order | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("driver_id", driverId)
    .in("status", ["out_for_delivery", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Order>();

  return data;
}

export async function getDriverDeliveryHistory(
  driverId: string,
  limit = 20
): Promise<Order[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("driver_id", driverId)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Order[];
}
