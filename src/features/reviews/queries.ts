import "server-only";
import { createClient } from "@/infra/supabase/server";

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  author: { id: string; full_name: string; avatar_url: string | null };
  order_id: string | null;
};

type RawReview = {
  id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  order_id: string | null;
  author: { id: string; full_name: string; avatar_url: string | null } | { id: string; full_name: string; avatar_url: string | null }[];
};

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export type ReviewsSummary = {
  avg: number;
  total: number;
  distribution: RatingDistribution;
};

const SELECT = `
  id, rating, comment, reply, replied_at, created_at, order_id,
  author:profiles!customer_id(id, full_name, avatar_url)
` as const;

function unwrapAuthor(
  v: RawReview["author"]
): Review["author"] {
  return Array.isArray(v) ? v[0] : v;
}

export async function getRestaurantReviews(
  restaurantId: string,
  limit = 20,
  offset = 0
): Promise<Review[]> {
  const supabase = await createClient();

  // Join customers → profiles to get author info
  const { data } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, reply, replied_at, created_at, order_id,
      customer:customers!customer_id(
        profile:profiles!profile_id(id, full_name, avatar_url)
      )
    `)
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!data) return [];

  return data.map((r: any) => {
    const customerRaw = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    const profileRaw = customerRaw
      ? Array.isArray(customerRaw.profile)
        ? customerRaw.profile[0]
        : customerRaw.profile
      : null;

    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reply: r.reply,
      replied_at: r.replied_at,
      created_at: r.created_at,
      order_id: r.order_id,
      author: profileRaw ?? { id: "", full_name: "Cliente", avatar_url: null },
    };
  });
}

export async function getReviewsSummary(
  restaurantId: string
): Promise<ReviewsSummary> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("restaurant_id", restaurantId);

  if (!data || data.length === 0) {
    return {
      avg: 0,
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const { rating } of data) {
    const r = rating as 1 | 2 | 3 | 4 | 5;
    distribution[r] = (distribution[r] ?? 0) + 1;
    sum += rating;
  }

  return {
    avg: Math.round((sum / data.length) * 10) / 10,
    total: data.length,
    distribution,
  };
}

export async function getCustomerReview(
  customerId: string,
  restaurantId: string
): Promise<{ id: string; rating: number; comment: string | null } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("customer_id", customerId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  return data as { id: string; rating: number; comment: string | null } | null;
}

export async function getCustomerReviews(customerId: string): Promise<
  Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    restaurant: { id: string; name: string; slug: string; logo_url: string | null };
  }>
> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, created_at,
      restaurant:restaurants!restaurant_id(id, name, slug, logo_url)
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    restaurant: Array.isArray(r.restaurant) ? r.restaurant[0] : r.restaurant,
  }));
}
