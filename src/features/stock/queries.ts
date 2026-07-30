import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { StockItem, StockMovement, StockRecipe } from "@/types/database.types";

export async function listStockItems(restaurantId: string): Promise<StockItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  return (data ?? []) as StockItem[];
}

export async function listStockMovements(restaurantId: string, limit = 100): Promise<StockMovement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as StockMovement[];
}

export type StockRecipeWithNames = StockRecipe & {
  product_name: string;
  stock_item_name: string;
  stock_item_unit_type: string;
};

export async function listStockRecipes(restaurantId: string): Promise<StockRecipeWithNames[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_recipes")
    .select("*, products(name), stock_items(name, unit_type)")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const r = row as StockRecipe & {
      products: { name: string } | null;
      stock_items: { name: string; unit_type: string } | null;
    };
    return {
      ...r,
      product_name: r.products?.name ?? "—",
      stock_item_name: r.stock_items?.name ?? "—",
      stock_item_unit_type: r.stock_items?.unit_type ?? "un",
    };
  });
}

export async function listRestaurantProducts(
  restaurantId: string
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name")
    .eq("restaurant_id", restaurantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return data ?? [];
}

export type StockConsumptionRow = {
  itemName: string;
  quantity: number;
  totalCostCents: number;
};

export async function getStockConsumptionReport(
  restaurantId: string,
  days: number
): Promise<{ rows: StockConsumptionRow[]; totalCostCents: number }> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("stock_movements")
    .select("quantity, total_cost_cents, stock_items(name)")
    .eq("restaurant_id", restaurantId)
    .eq("type", "out")
    .gte("created_at", since.toISOString());

  const entries = (data ?? []) as unknown as {
    quantity: number;
    total_cost_cents: number;
    stock_items: { name: string } | null;
  }[];

  const byItem = new Map<string, StockConsumptionRow>();
  let totalCostCents = 0;

  for (const e of entries) {
    const name = e.stock_items?.name ?? "—";
    const existing = byItem.get(name);
    if (existing) {
      existing.quantity += e.quantity;
      existing.totalCostCents += e.total_cost_cents;
    } else {
      byItem.set(name, { itemName: name, quantity: e.quantity, totalCostCents: e.total_cost_cents });
    }
    totalCostCents += e.total_cost_cents;
  }

  const rows = Array.from(byItem.values()).sort((a, b) => b.totalCostCents - a.totalCostCents);
  return { rows, totalCostCents };
}
