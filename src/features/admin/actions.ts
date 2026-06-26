"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import type { RestaurantStatus } from "@/types/database.types";

/**
 * Master admin: altera o status de um restaurante (aprovar/bloquear).
 * RLS garante que apenas master_admin consegue executar o update global.
 */
export async function setRestaurantStatusAction(
  restaurantId: string,
  status: RestaurantStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ status })
    .eq("id", restaurantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
