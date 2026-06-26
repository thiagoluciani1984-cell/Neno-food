import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { RestaurantSettings } from "@/types/database.types";
import { DEFAULT_HOURS } from "./schemas";

export async function getRestaurantSettings(
  restaurantId: string
): Promise<RestaurantSettings | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle<RestaurantSettings>();

  return data ?? null;
}

export function buildDefaultSettings(restaurantId: string): Partial<RestaurantSettings> {
  return {
    restaurant_id: restaurantId,
    is_open: false,
    accepts_delivery: true,
    accepts_pickup: false,
    accepts_dine_in: false,
    delivery_fee_cents: 500,
    free_delivery_above_cents: null,
    min_order_cents: 2000,
    delivery_radius_km: 5,
    avg_prep_minutes: 30,
    payment_methods: ["pix", "cash", "card"],
    opening_hours: DEFAULT_HOURS,
    address_street: null,
    address_number: null,
    address_district: null,
    address_city: null,
    address_state: null,
    address_zip: null,
  };
}
