"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession, getActiveRestaurantId } from "@/features/auth/get-session";
import { notifyLowStock } from "@/features/notifications/lib";
import {
  stockItemSchema,
  stockRecipeSchema,
  stockMovementSchema,
  type StockItemInput,
  type StockRecipeInput,
  type StockMovementInput,
} from "./schemas";

export type StockActionResult = { ok: true } | { ok: false; error: string };

export async function saveStockItemAction(input: StockItemInput): Promise<StockActionResult> {
  const parsed = stockItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não encontrado." };

  const supabase = await createClient();
  const payload = {
    restaurant_id: restaurantId,
    name: data.name,
    unit_type: data.unit_type,
    min_quantity: data.min_quantity,
    unit_cost_cents: data.unit_cost_cents,
    updated_at: new Date().toISOString(),
  };

  const { error } = data.id
    ? await supabase.from("stock_items").update(payload).eq("id", data.id)
    : await supabase.from("stock_items").insert(payload);

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Já existe um insumo com esse nome." : "Falha ao salvar insumo.",
    };
  }

  revalidatePath("/dashboard/estoque");
  return { ok: true };
}

export async function deactivateStockItemAction(itemId: string): Promise<StockActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stock_items")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) return { ok: false, error: "Falha ao remover insumo." };

  revalidatePath("/dashboard/estoque");
  return { ok: true };
}

export async function saveStockRecipeAction(input: StockRecipeInput): Promise<StockActionResult> {
  const parsed = stockRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não encontrado." };

  const supabase = await createClient();
  const { error } = await supabase.from("stock_recipes").upsert(
    {
      restaurant_id: restaurantId,
      product_id: data.product_id,
      stock_item_id: data.stock_item_id,
      quantity_per_unit: data.quantity_per_unit,
    },
    { onConflict: "product_id,stock_item_id" }
  );

  if (error) return { ok: false, error: "Falha ao salvar ficha técnica." };

  revalidatePath("/dashboard/estoque");
  return { ok: true };
}

export async function deleteStockRecipeAction(recipeId: string): Promise<StockActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("stock_recipes").delete().eq("id", recipeId);

  if (error) return { ok: false, error: "Falha ao remover item da ficha técnica." };

  revalidatePath("/dashboard/estoque");
  return { ok: true };
}

export async function createStockMovementAction(input: StockMovementInput): Promise<StockActionResult> {
  const parsed = stockMovementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não encontrado." };

  const { user, profile } = await getSession();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("stock_items")
    .select("id, name, unit_type, unit_cost_cents")
    .eq("id", data.stock_item_id)
    .single<{ id: string; name: string; unit_type: string; unit_cost_cents: number }>();

  if (!item) return { ok: false, error: "Insumo não encontrado." };

  const unitCostCents = data.unit_cost_cents ?? item.unit_cost_cents;
  const totalCostCents = Math.round(data.quantity * unitCostCents);

  const { error } = await supabase.from("stock_movements").insert({
    restaurant_id: restaurantId,
    stock_item_id: data.stock_item_id,
    type: data.type,
    reason: data.reason,
    quantity: data.quantity,
    unit_cost_cents: unitCostCents,
    total_cost_cents: totalCostCents,
    notes: data.notes?.trim() || null,
    created_by: profile?.id ?? user.id,
  });

  if (error) return { ok: false, error: "Falha ao registrar movimentação." };

  const { data: updatedItem } = await supabase
    .from("stock_items")
    .select("id, name, current_quantity, min_quantity, unit_type")
    .eq("id", data.stock_item_id)
    .single<{ id: string; name: string; current_quantity: number; min_quantity: number; unit_type: string }>();

  if (updatedItem && updatedItem.current_quantity < updatedItem.min_quantity) {
    await notifyLowStock(restaurantId, updatedItem);
  }

  if (data.reason === "loss" || data.reason === "adjustment") {
    await supabase.from("audit_logs").insert({
      actor_id: profile?.id ?? user.id,
      action: "update",
      entity_type: "stock_movement",
      restaurant_id: restaurantId,
      new_data: { stock_item_id: data.stock_item_id, reason: data.reason, quantity: data.quantity, notes: data.notes ?? null },
    });
  }

  revalidatePath("/dashboard/estoque");
  return { ok: true };
}
