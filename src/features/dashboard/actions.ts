"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { listDashboardRestaurants } from "@/features/auth/get-session";

export async function setDashboardRestaurantAction(
  slug: string
): Promise<{ ok: boolean; error?: string }> {
  const restaurants = await listDashboardRestaurants();
  const allowed = restaurants.some((r) => r.slug === slug);

  if (!allowed) {
    return { ok: false, error: "Restaurante inválido." };
  }

  const cookieStore = await cookies();
  cookieStore.set("dashboard_restaurant", slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
