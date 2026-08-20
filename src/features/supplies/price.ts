import type { SupplyEntry, SupplyItem } from "@/types/database.types";

function getNormalizedItemName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function resolveReplacementItemName(itemName: string | null | undefined) {
  const normalized = getNormalizedItemName(itemName);

  if (normalized === "sorvete (pote 5l)") return "sorvete 2l";
  return null;
}

export function shouldHideSupplyEntry(entryName: string | null | undefined) {
  return getNormalizedItemName(entryName) === "sorvete (pote 5l)";
}

export function getSupplyEntryEffectiveTotalCents(
  entry: Pick<SupplyEntry, "quantity" | "unit_price_cents" | "total_cents" | "item_name">,
  item: Pick<SupplyItem, "default_price_cents" | "name"> | null | undefined,
  replacementItem?: Pick<SupplyItem, "default_price_cents" | "name"> | null | undefined
): number {
  const currentItemPriceCents = item?.default_price_cents ?? replacementItem?.default_price_cents ?? 0;

  if (currentItemPriceCents > 0) {
    return Math.round(entry.quantity * currentItemPriceCents);
  }

  if (entry.unit_price_cents > 0) {
    return Math.round(entry.quantity * entry.unit_price_cents);
  }

  if (entry.total_cents > 0) {
    return entry.total_cents;
  }

  return 0;
}

export function resolveSupplyItemReplacement(itemName: string | null | undefined, items: Array<Pick<SupplyItem, "name" | "default_price_cents">>) {
  const replacementName = resolveReplacementItemName(itemName);
  if (!replacementName) return null;

  return items.find((item) => getNormalizedItemName(item.name) === replacementName) ?? null;
}

export function buildDisplaySupplyEntry<T extends Pick<SupplyEntry, "item_name" | "quantity" | "unit_type" | "taken_at" | "unit_price_cents" | "total_cents" | "status" | "paid_at" | "id">>(
  entry: T,
  _item: Pick<SupplyItem, "default_price_cents" | "name"> | null | undefined,
  replacementItem: Pick<SupplyItem, "name" | "default_price_cents"> | null | undefined
) {
  if (!shouldHideSupplyEntry(entry.item_name) || !replacementItem) return null;

  return {
    ...entry,
    item_name: replacementItem.name,
    quantity: entry.quantity + 1,
  } as T & { item_name: string; quantity: number };
}
