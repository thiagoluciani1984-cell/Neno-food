"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";

async function resolveCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
) {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function toggleProductFavoriteAction(
  productId: string
): Promise<{ favorited: boolean } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Faça login para favoritar." };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  const { data: existing } = await supabase
    .from("favorites")
    .select("customer_id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("customer_id", customerId)
      .eq("product_id", productId);
    revalidatePath("/account");
    return { favorited: false };
  } else {
    await supabase.from("favorites").insert({ customer_id: customerId, product_id: productId });
    revalidatePath("/account");
    return { favorited: true };
  }
}

export async function toggleRestaurantFavoriteAction(
  restaurantId: string,
  restaurantSlug: string
): Promise<{ favorited: boolean } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Faça login para favoritar." };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  const { data: existing } = await supabase
    .from("restaurant_favorites")
    .select("customer_id")
    .eq("customer_id", customerId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("restaurant_favorites")
      .delete()
      .eq("customer_id", customerId)
      .eq("restaurant_id", restaurantId);
    revalidatePath(`/${restaurantSlug}`);
    revalidatePath("/account");
    return { favorited: false };
  } else {
    await supabase
      .from("restaurant_favorites")
      .insert({ customer_id: customerId, restaurant_id: restaurantId });
    revalidatePath(`/${restaurantSlug}`);
    revalidatePath("/account");
    return { favorited: true };
  }
}
