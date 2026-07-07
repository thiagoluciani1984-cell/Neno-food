import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createClient } from "@/infra/supabase/server";
import type { Profile } from "@/types/database.types";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null as Profile | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile };
});

async function restaurantIdFromSlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

/**
 * Restaurante ativo no dashboard:
 * 1. profile.restaurant_id (dono/staff)
 * 2. cookie dashboard_restaurant (master_admin)
 * 3. slug padrão do .env
 */
export async function getActiveRestaurantId(): Promise<string | null> {
  const { profile } = await getSession();
  if (profile?.restaurant_id) return profile.restaurant_id;

  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get("dashboard_restaurant")?.value;
  if (cookieSlug) {
    const id = await restaurantIdFromSlug(cookieSlug);
    if (id) return id;
  }

  return restaurantIdFromSlug(
    process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG ?? "lucianis-di-qualita"
  );
}

export async function resolveDashboardRestaurantId(
  slug?: string | null
): Promise<string | null> {
  if (slug) {
    const id = await restaurantIdFromSlug(slug);
    if (id) return id;
  }
  return getActiveRestaurantId();
}

export async function getDashboardRestaurantId(): Promise<string | null> {
  return getActiveRestaurantId();
}

export async function listDashboardRestaurants(): Promise<
  Array<{ id: string; name: string; slug: string }>
> {
  const { profile } = await getSession();
  if (!profile || !["master_admin", "moderator"].includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("status", "active")
    .order("name");

  return data ?? [];
}

export async function getDashboardRestaurantSummary(): Promise<{
  id: string;
  name: string;
  slug: string;
} | null> {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("id", restaurantId)
    .maybeSingle<{ id: string; name: string; slug: string }>();

  return data;
}
