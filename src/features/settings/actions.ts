"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { settingsSchema, type SettingsInput } from "./schemas";

export type SaveSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveSettingsAction(
  input: SettingsInput
): Promise<SaveSettingsResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não encontrado." };

  const supabase = await createClient();

  const payload = {
    restaurant_id: restaurantId,
    is_open: data.is_open,
    accepts_delivery: data.accepts_delivery,
    accepts_pickup: data.accepts_pickup,
    accepts_dine_in: data.accepts_dine_in,
    delivery_fee_cents: data.delivery_fee_cents,
    free_delivery_above_cents: data.free_delivery_above_cents,
    min_order_cents: data.min_order_cents,
    delivery_radius_km: data.delivery_radius_km,
    avg_prep_minutes: data.avg_prep_minutes,
    payment_methods: data.payment_methods,
    opening_hours: data.opening_hours,
    address_street: data.address_street,
    address_number: data.address_number,
    address_district: data.address_district,
    address_city: data.address_city,
    address_state: data.address_state,
    address_zip: data.address_zip,
    pagarme_recipient_id: data.pagarme_recipient_id?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // Upsert: cria se não existe, atualiza se existe
  const { error } = await supabase
    .from("restaurant_settings")
    .upsert(payload, { onConflict: "restaurant_id" });

  if (error) {
    return { ok: false, error: "Falha ao salvar configurações. Tente novamente." };
  }

  const { error: restaurantError } = await supabase
    .from("restaurants")
    .update({
      establishment_type: data.establishment_type,
      cuisine: data.cuisine,
    })
    .eq("id", restaurantId);

  if (restaurantError) {
    return { ok: false, error: "Falha ao salvar categoria. Tente novamente." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleOpenAction(
  isOpen: boolean
): Promise<SaveSettingsResult> {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não encontrado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_settings")
    .update({ is_open: isOpen, updated_at: new Date().toISOString() })
    .eq("restaurant_id", restaurantId);

  if (error) return { ok: false, error: "Falha ao atualizar status." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
