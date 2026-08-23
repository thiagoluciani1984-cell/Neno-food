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

  // Curto de propósito: uma seleção esquecida não pode ficar "grudada"
  // por semanas e misturar lançamentos/relatórios de restaurantes
  // diferentes sem ninguém perceber (já aconteceu — ver 0049).
  const cookieStore = await cookies();
  cookieStore.set("dashboard_restaurant", slug, {
    path: "/",
    maxAge: 60 * 60 * 12,
    sameSite: "lax",
  });

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
