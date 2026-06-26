import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { ProductOption, ProductOptionItem } from "@/types/database.types";

export interface OptionGroupWithItems extends ProductOption {
  product_option_items: ProductOptionItem[];
}

export async function getProductOptions(productId: string): Promise<OptionGroupWithItems[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_options")
    .select("*, product_option_items(id, option_id, name, price_cents, is_available, sort_order, created_at, updated_at)")
    .eq("product_id", productId)
    .order("sort_order");

  return (data ?? []).map((g) => ({
    ...g,
    product_option_items: (
      Array.isArray(g.product_option_items) ? g.product_option_items : []
    ).sort((a: ProductOptionItem, b: ProductOptionItem) => a.sort_order - b.sort_order),
  })) as OptionGroupWithItems[];
}
