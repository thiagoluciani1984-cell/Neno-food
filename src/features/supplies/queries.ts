import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { SupplyItem, SupplyEntry } from "@/types/database.types";

export type PartnerRestaurant = { id: string; name: string; slug: string };

/** Restaurante parceiro de troca de insumos (0049) — quem forneceu lança, o parceiro aprova. */
export async function getPartnerRestaurant(restaurantId: string): Promise<PartnerRestaurant | null> {
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("partner_restaurant_id")
    .eq("id", restaurantId)
    .maybeSingle<{ partner_restaurant_id: string | null }>();

  if (!restaurant?.partner_restaurant_id) return null;

  const { data: partner } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("id", restaurant.partner_restaurant_id)
    .maybeSingle<PartnerRestaurant>();

  return partner ?? null;
}

export async function listSupplyItems(restaurantId: string): Promise<SupplyItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supply_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  return (data ?? []) as SupplyItem[];
}

export async function listSupplyEntries(restaurantId: string): Promise<SupplyEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supply_entries")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  return (data ?? []) as SupplyEntry[];
}
