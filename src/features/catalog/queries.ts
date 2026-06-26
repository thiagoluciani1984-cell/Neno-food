import "server-only";
import { createClient } from "@/infra/supabase/server";
import type {
  Category,
  Product,
  Restaurant,
  RestaurantSettings,
} from "@/types/database.types";

export interface MenuData {
  restaurant: Restaurant;
  settings: RestaurantSettings | null;
  categories: (Category & { products: Product[] })[];
}

/**
 * Carrega o cardápio público de um restaurante pelo slug, agrupando
 * produtos disponíveis por categoria (ordenados).
 */
export async function getMenuBySlug(slug: string): Promise<MenuData | null> {
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single<Restaurant>();

  if (!restaurant) return null;

  const [{ data: settings }, { data: categories }, { data: products }] =
    await Promise.all([
      supabase
        .from("restaurant_settings")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle<RestaurantSettings>(),
      supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("products")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .is("deleted_at", null)
        .order("sort_order"),
    ]);

  const grouped = (categories ?? []).map((cat) => ({
    ...(cat as Category),
    products: (products ?? []).filter(
      (p) => (p as Product).category_id === cat.id
    ) as Product[],
  }));

  return {
    restaurant,
    settings: settings ?? null,
    categories: grouped.filter((c) => c.products.length > 0),
  };
}

/**
 * Lista completa para a gestão (dashboard): inclui itens indisponíveis,
 * exclui apenas os soft-deleted.
 */
export async function getManagedCatalog(restaurantId: string): Promise<{
  categories: Category[];
  products: Product[];
}> {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .is("deleted_at", null)
      .order("sort_order"),
  ]);

  return {
    categories: (categories ?? []) as Category[],
    products: (products ?? []) as Product[],
  };
}
