"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession, getActiveRestaurantId } from "@/features/auth/get-session";
import { notifySupplyEntryPending } from "@/features/notifications/lib";
import { supplyItemSchema, supplyEntrySchema, type SupplyItemInput, type SupplyEntryInput } from "./schemas";

export type SupplyActionResult = { ok: true } | { ok: false; error: string };

export async function saveSupplyItemAction(input: SupplyItemInput): Promise<SupplyActionResult> {
  const parsed = supplyItemSchema.safeParse(input);
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
    default_price_cents: data.default_price_cents,
    updated_at: new Date().toISOString(),
  };

  const { error } = data.id
    ? await supabase.from("supply_items").update(payload).eq("id", data.id)
    : await supabase.from("supply_items").insert(payload);

  if (error) return { ok: false, error: "Falha ao salvar item. Tente novamente." };

  revalidatePath("/dashboard/supplies");
  return { ok: true };
}

export async function deactivateSupplyItemAction(itemId: string): Promise<SupplyActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("supply_items")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) return { ok: false, error: "Falha ao remover item." };

  revalidatePath("/dashboard/supplies");
  return { ok: true };
}

export async function createSupplyEntryAction(input: SupplyEntryInput): Promise<SupplyActionResult> {
  const parsed = supplyEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não encontrado." };

  const { user, profile } = await getSession();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const totalCents = Math.round(data.quantity * data.unit_price_cents);

  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from("supply_entries")
    .insert({
      restaurant_id: restaurantId,
      item_id: data.item_id,
      item_name: data.item_name,
      unit_type: data.unit_type,
      quantity: data.quantity,
      unit_price_cents: data.unit_price_cents,
      total_cents: totalCents,
      taken_at: data.taken_at,
      notes: data.notes?.trim() || null,
      created_by: profile?.id ?? user.id,
    })
    .select("id, item_name, quantity, unit_type")
    .single();

  if (error || !entry) return { ok: false, error: "Falha ao lançar item. Tente novamente." };

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", restaurantId)
    .maybeSingle<{ name: string }>();

  await notifySupplyEntryPending(entry, restaurant?.name ?? "Restaurante");

  revalidatePath("/dashboard/supplies");
  return { ok: true };
}

export async function updateSupplyEntryAction(
  entryId: string,
  input: SupplyEntryInput
): Promise<SupplyActionResult> {
  const parsed = supplyEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;
  const totalCents = Math.round(data.quantity * data.unit_price_cents);

  const supabase = await createClient();
  const { error, data: updated } = await supabase
    .from("supply_entries")
    .update({
      item_id: data.item_id,
      item_name: data.item_name,
      unit_type: data.unit_type,
      quantity: data.quantity,
      unit_price_cents: data.unit_price_cents,
      total_cents: totalCents,
      taken_at: data.taken_at,
      notes: data.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .select("id")
    .single();

  // A RLS já bloqueia update de lançamento aprovado (status <> 'approved'
  // no policy) — 0 linhas afetadas aqui significa "já aprovado" ou "não é seu".
  if (error || !updated) {
    return { ok: false, error: "Não foi possível editar — o lançamento já pode ter sido aprovado." };
  }

  revalidatePath("/dashboard/supplies");
  return { ok: true };
}

export async function deleteSupplyEntryAction(entryId: string): Promise<SupplyActionResult> {
  const supabase = await createClient();
  const { error, data: deleted } = await supabase
    .from("supply_entries")
    .delete()
    .eq("id", entryId)
    .select("id")
    .single();

  if (error || !deleted) {
    return { ok: false, error: "Não foi possível excluir — o lançamento já pode ter sido aprovado." };
  }

  revalidatePath("/dashboard/supplies");
  return { ok: true };
}

async function setSupplyEntryStatus(
  entryId: string,
  status: "approved" | "rejected"
): Promise<SupplyActionResult> {
  const { user, profile } = await getSession();
  if (!user || !profile) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("supply_entries")
    .select("id, restaurant_id, created_by")
    .eq("id", entryId)
    .maybeSingle<{ id: string; restaurant_id: string; created_by: string | null }>();

  if (!entry) return { ok: false, error: "Lançamento não encontrado." };

  // Quem lançou não aprova o próprio lançamento — o outro lado do
  // restaurante confirma. master_admin sempre pode, como reforço.
  const isMasterAdmin = profile.role === "master_admin";
  const isSameRestaurant = profile.restaurant_id === entry.restaurant_id;
  const isOwnEntry = entry.created_by === profile.id;
  if (!isMasterAdmin && !(isSameRestaurant && !isOwnEntry)) {
    return { ok: false, error: "Sem permissão — só quem não lançou este item pode aprovar." };
  }

  const update: Record<string, unknown> = { status, approved_by: profile.id };
  if (status === "approved") update.approved_at = new Date().toISOString();

  const { error } = await supabase.from("supply_entries").update(update).eq("id", entryId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/supplies");
  return { ok: true };
}

export async function approveSupplyEntryAction(entryId: string): Promise<SupplyActionResult> {
  return setSupplyEntryStatus(entryId, "approved");
}

export async function rejectSupplyEntryAction(entryId: string): Promise<SupplyActionResult> {
  return setSupplyEntryStatus(entryId, "rejected");
}

export type CloseBatchResult = { ok: true; count: number } | { ok: false; error: string };

/** Marca todo lançamento aprovado-e-ainda-não-pago como pago agora (fecha o lote). */
export async function closeSupplyBatchAction(): Promise<CloseBatchResult> {
  const { profile } = await getSession();
  if (profile?.role !== "master_admin") {
    return { ok: false, error: "Sem permissão." };
  }

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não encontrado." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_supply_batch", {
    p_restaurant_id: restaurantId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/supplies");
  return { ok: true, count: data ?? 0 };
}
