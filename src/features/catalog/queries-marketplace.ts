import "server-only";
import { createClient } from "@/infra/supabase/server";
import { PUBLIC_RESTAURANT_SETTINGS_COLUMNS } from "@/features/catalog/queries";
import type { Product, Restaurant, RestaurantSettings } from "@/types/database.types";

export interface RestaurantCard {
  restaurant: Restaurant;
  settings: RestaurantSettings | null;
}

export interface MarketplaceProductHit {
  product: Pick<
    Product,
    "id" | "name" | "slug" | "description" | "price_cents" | "promo_price_cents" | "image_url"
  >;
  restaurant: Pick<Restaurant, "id" | "name" | "slug" | "logo_url">;
}

const MARKETPLACE_QUERY_TIMEOUT_MS =
  process.env.NODE_ENV === "development" ? 1500 : 4000;

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MARKETPLACE_QUERY_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

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
      .select(PUBLIC_RESTAURANT_SETTINGS_COLUMNS)
      .in("restaurant_id", ids)
      .abortSignal(settingsController.signal)
      .returns<RestaurantSettings[]>();

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

export async function searchMarketplaceProducts(
  query: string,
  limit = 12
): Promise<MarketplaceProductHit[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const safeTerm = term.replace(/[%_,]/g, " ").trim();
  if (!safeTerm) return [];

  const supabase = await createClient();

  const activeIds = await withTimeout(async (signal) => {
    const { data } = await supabase
      .from("restaurants")
      .select("id")
      .eq("status", "active")
      .abortSignal(signal);
    return (data ?? []).map((r) => r.id);
  });

  if (!activeIds?.length) return [];

  const data = await withTimeout(async (signal) => {
    const { data: rows } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, description, price_cents, promo_price_cents, image_url,
        restaurants(id, name, slug, logo_url)
      `
      )
      .in("restaurant_id", activeIds)
      .eq("is_available", true)
      .or(`name.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`)
      .order("name")
      .limit(limit)
      .abortSignal(signal);

    return rows;
  });

  if (!data) return [];

  return mapProductHits(data as Array<Record<string, unknown>>);
}

export async function getFeaturedProducts(
  limit = 8
): Promise<MarketplaceProductHit[]> {
  const supabase = await createClient();

  const activeIds = await withTimeout(async (signal) => {
    const { data } = await supabase
      .from("restaurants")
      .select("id")
      .eq("status", "active")
      .abortSignal(signal);
    return (data ?? []).map((r) => r.id);
  });

  if (!activeIds?.length) return [];

  const data = await withTimeout(async (signal) => {
    const { data: rows } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, description, price_cents, promo_price_cents, image_url,
        restaurants(id, name, slug, logo_url)
      `
      )
      .in("restaurant_id", activeIds)
      .eq("is_available", true)
      .eq("is_featured", true)
      .order("name")
      .limit(limit)
      .abortSignal(signal);

    return rows;
  });

  if (!data?.length) {
    const fallback = await withTimeout(async (signal) => {
      const { data: rows } = await supabase
        .from("products")
        .select(
          `
          id, name, slug, description, price_cents, promo_price_cents, image_url,
          restaurants(id, name, slug, logo_url)
        `
        )
        .in("restaurant_id", activeIds)
        .eq("is_available", true)
        .order("name")
        .limit(limit)
        .abortSignal(signal);
      return rows;
    });
    if (!fallback) return [];
    return mapProductHits(fallback);
  }

  return mapProductHits(data);
}

function mapProductHits(
  data: Array<Record<string, unknown>>
): MarketplaceProductHit[] {
  return data.map((row) => {
    const raw = row.restaurants;
    const restaurant = (Array.isArray(raw) ? raw[0] : raw) as Pick<
      Restaurant,
      "id" | "name" | "slug" | "logo_url"
    >;
    return {
      product: {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        description: row.description as string | null,
        price_cents: row.price_cents as number,
        promo_price_cents: row.promo_price_cents as number | null,
        image_url: row.image_url as string | null,
      },
      restaurant,
    };
  });
}
