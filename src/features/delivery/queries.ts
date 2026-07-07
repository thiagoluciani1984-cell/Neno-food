import "server-only";
import { createClient } from "@/infra/supabase/server";
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
