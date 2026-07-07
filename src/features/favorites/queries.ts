import "server-only";
import { createClient } from "@/infra/supabase/server";

export type FavoriteProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  restaurant: { id: string; name: string; slug: string };
};

export type FavoriteRestaurant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  cuisine: string;
  avg_rating: number;
  total_reviews: number;
};

export async function getCustomerFavoriteProducts(
  customerId: string
): Promise<FavoriteProduct[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("favorites")
    .select(`
      product:products!product_id(
        id, name, slug, description, price_cents, image_url,
        category:categories!category_id(
          restaurant:restaurants!restaurant_id(id, name, slug)
        )
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((row: any) => {
    const p = Array.isArray(row.product) ? row.product[0] : row.product;
    const cat = p?.category ? (Array.isArray(p.category) ? p.category[0] : p.category) : null;
    const rest = cat?.restaurant ? (Array.isArray(cat.restaurant) ? cat.restaurant[0] : cat.restaurant) : null;
    return {
      id: p?.id ?? "",
      name: p?.name ?? "",
      slug: p?.slug ?? "",
      description: p?.description ?? null,
      price_cents: p?.price_cents ?? 0,
      image_url: p?.image_url ?? null,
      restaurant: rest ?? { id: "", name: "", slug: "" },
    };
  });
}

export async function getCustomerFavoriteRestaurants(
  customerId: string
): Promise<FavoriteRestaurant[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurant_favorites")
    .select(`
      restaurant:restaurants!restaurant_id(
        id, name, slug, logo_url, cover_url, cuisine, avg_rating, total_reviews
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((row: any) => {
    const r = Array.isArray(row.restaurant) ? row.restaurant[0] : row.restaurant;
    return {
      id: r?.id ?? "",
      name: r?.name ?? "",
      slug: r?.slug ?? "",
      logo_url: r?.logo_url ?? null,
      cover_url: r?.cover_url ?? null,
      cuisine: r?.cuisine ?? "",
      avg_rating: r?.avg_rating ?? 0,
      total_reviews: r?.total_reviews ?? 0,
    };
  });
}

export async function isProductFavorited(
  customerId: string,
  productId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("customer_id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

export async function isRestaurantFavorited(
  customerId: string,
  restaurantId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_favorites")
    .select("customer_id")
    .eq("customer_id", customerId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  return !!data;
}
