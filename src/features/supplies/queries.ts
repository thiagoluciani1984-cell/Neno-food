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

export type SupplyReportRow = {
  month: string; // "2026-07"
  itemName: string;
  quantity: number;
  totalCents: number;
};

export async function getSupplyReport(restaurantId: string): Promise<{
  rows: SupplyReportRow[];
  totalCents: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supply_entries")
    .select("item_name, quantity, total_cents, taken_at")
    .eq("restaurant_id", restaurantId)
    .eq("status", "approved")
    .order("taken_at", { ascending: false });

  const entries = (data ?? []) as Pick<
    SupplyEntry,
    "item_name" | "quantity" | "total_cents" | "taken_at"
  >[];

  const byKey = new Map<string, SupplyReportRow>();
  let totalCents = 0;

  for (const e of entries) {
    const month = e.taken_at.slice(0, 7);
    const key = `${month}::${e.item_name}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += e.quantity;
      existing.totalCents += e.total_cents;
    } else {
      byKey.set(key, { month, itemName: e.item_name, quantity: e.quantity, totalCents: e.total_cents });
    }
    totalCents += e.total_cents;
  }

  const rows = Array.from(byKey.values()).sort((a, b) => b.month.localeCompare(a.month));
  return { rows, totalCents };
}
