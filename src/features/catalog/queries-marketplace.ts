import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { Restaurant, RestaurantSettings } from "@/types/database.types";

export interface RestaurantCard {
  restaurant: Restaurant;
  settings: RestaurantSettings | null;
}

const MARKETPLACE_QUERY_TIMEOUT_MS =
  process.env.NODE_ENV === "development" ? 1500 : 4000;

export async function listActiveRestaurants(): Promise<RestaurantCard[]> {
  const supabase = await createClient();
  const restaurantsController = new AbortController();
  const restaurantsTimeout = setTimeout(
    () => restaurantsController.abort(),
    MARKETPLACE_QUERY_TIMEOUT_MS
  );

  let restaurants: Restaurant[] | null = null;

  try {
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "active")
      .order("created_at")
      .abortSignal(restaurantsController.signal);

    restaurants = (data ?? []) as Restaurant[];
  } catch {
    return [];
  } finally {
    clearTimeout(restaurantsTimeout);
  }

  if (!restaurants?.length) return [];

  const ids = restaurants.map((r) => r.id);
  const settingsController = new AbortController();
  const settingsTimeout = setTimeout(
    () => settingsController.abort(),
    MARKETPLACE_QUERY_TIMEOUT_MS
  );

  let settings: RestaurantSettings[] = [];

  try {
    const { data } = await supabase
      .from("restaurant_settings")
      .select("*")
      .in("restaurant_id", ids)
      .abortSignal(settingsController.signal);

    settings = (data ?? []) as RestaurantSettings[];
  } catch {
    settings = [];
  } finally {
    clearTimeout(settingsTimeout);
  }

  return restaurants.map((r) => ({
    restaurant: r,
    settings:
      settings.find((s) => s.restaurant_id === r.id) ?? null,
  }));
}
