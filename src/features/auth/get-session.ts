import "server-only";
import { cache } from "react";
import { createClient } from "@/infra/supabase/server";
import type { Profile } from "@/types/database.types";

/**
 * Recupera o usuário autenticado e seu profile (com role/restaurant_id).
 * `cache` deduplica chamadas dentro do mesmo request.
 */
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

/**
 * Resolve o restaurant_id do contexto atual.
 * - Staff de restaurante: usa o restaurant_id do profile.
 * - Caso contrário: cai para o restaurante padrão (operação single-tenant).
 */
export async function getActiveRestaurantId(): Promise<string | null> {
  const { profile } = await getSession();
  if (profile?.restaurant_id) return profile.restaurant_id;

  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG ?? "lucianis-di-qualita")
    .single<{ id: string }>();

  return data?.id ?? null;
}
