import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { SupplyItem, SupplyEntry } from "@/types/database.types";

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
