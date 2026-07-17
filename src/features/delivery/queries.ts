import "server-only";
import { createClient } from "@/infra/supabase/server";
import { createAdminClient } from "@/infra/supabase/admin";
import { generateDeliveryPin } from "./lib";

export async function getDeliveryCodeForOrder(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_codes")
    .select("code, confirmed_at, expires_at")
    .eq("order_id", orderId)
    .maybeSingle<{
      code: string;
      confirmed_at: string | null;
      expires_at: string;
    }>();
  return data;
}

export async function ensureDeliveryCode(
  orderId: string,
  client?: Awaited<ReturnType<typeof createClient>>
) {
  const supabase = client ?? (await createClient());

  const { data: existing } = await supabase
    .from("delivery_codes")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) return;

  await supabase.from("delivery_codes").insert({
    order_id: orderId,
    code: generateDeliveryPin(),
  });
}

export interface OrderDriverInfo {
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  vehicle_type: string;
  vehicle_plate: string | null;
}

/**
 * Uses the admin client: RLS on `drivers`/`profiles` doesn't grant customers
 * visibility into their delivery driver, and callers only reach here after
 * `getOrderForTracking` has already authorized access to this exact order.
 */
export async function getDriverForOrder(orderId: string): Promise<OrderDriverInfo | null> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("driver_id")
    .eq("id", orderId)
    .maybeSingle<{ driver_id: string | null }>();

  if (!order?.driver_id) return null;

  const { data: driver } = await supabase
    .from("drivers")
    .select("vehicle_type, vehicle_plate, profiles:profile_id(full_name, phone, avatar_url)")
    .eq("id", order.driver_id)
    .maybeSingle<{
      vehicle_type: string;
      vehicle_plate: string | null;
      profiles: { full_name: string; phone: string | null; avatar_url: string | null } | null;
    }>();

  if (!driver?.profiles) return null;

  return {
    full_name: driver.profiles.full_name,
    phone: driver.profiles.phone,
    avatar_url: driver.profiles.avatar_url,
    vehicle_type: driver.vehicle_type,
    vehicle_plate: driver.vehicle_plate,
  };
}

export async function getLatestTrackingPoint(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_tracking")
    .select("latitude, longitude, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      latitude: number;
      longitude: number;
      created_at: string;
    }>();
  return data;
}
