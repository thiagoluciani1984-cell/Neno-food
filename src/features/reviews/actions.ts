"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import { reviewSchema } from "./schemas";

async function resolveCustomerId(supabase: Awaited<ReturnType<typeof createClient>>, profileId: string) {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function submitReviewAction(
  restaurantId: string,
  rating: number,
  comment: string,
  orderId?: string,
  existingReviewId?: string
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Faça login para avaliar." };

  const parsed = reviewSchema.safeParse({
    restaurant_id: restaurantId,
    order_id: orderId,
    rating,
    comment: comment || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  if (existingReviewId) {
    const { error } = await supabase
      .from("reviews")
      .update({ rating, comment: comment || null })
      .eq("id", existingReviewId)
      .eq("customer_id", customerId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("reviews").insert({
      restaurant_id: restaurantId,
      customer_id: customerId,
      order_id: orderId ?? null,
      rating,
      comment: comment || null,
    });
    if (error) return { error: error.message };
  }

  // Recalcular avg_rating e total_reviews no restaurante
  const { data: stats } = await supabase
    .from("reviews")
    .select("rating")
    .eq("restaurant_id", restaurantId);

  if (stats && stats.length > 0) {
    const avg = stats.reduce((s, r) => s + r.rating, 0) / stats.length;
    await supabase
      .from("restaurants")
      .update({
        avg_rating: Math.round(avg * 10) / 10,
        total_reviews: stats.length,
      })
      .eq("id", restaurantId);
  }

  revalidatePath(`/[restaurantSlug]`, "page");
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteReviewAction(
  reviewId: string,
  restaurantId: string
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("customer_id", customerId);

  if (error) return { error: error.message };

  revalidatePath(`/[restaurantSlug]`, "page");
  revalidatePath("/account");
  return { ok: true };
}
