import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPastClosingTime } from "@/core/domain/value-objects/opening-hours";
import type { RestaurantSettings } from "@/types/database.types";

/**
 * Corrige "is_open" preguiçosamente: se o restaurante está marcado aberto mas
 * já passou do horário de fechamento configurado, fecha automaticamente.
 * Chamado em toda leitura de restaurant_settings (loja pública e dashboard),
 * então não depende de nenhum cron — a próxima visita já autocorrige.
 */
export async function syncAutoCloseState(
  supabase: SupabaseClient,
  settings: RestaurantSettings | null
): Promise<RestaurantSettings | null> {
  if (!settings?.is_open) return settings;
  if (!isPastClosingTime(settings.opening_hours)) return settings;

  const { error } = await supabase
    .from("restaurant_settings")
    .update({ is_open: false, updated_at: new Date().toISOString() })
    .eq("restaurant_id", settings.restaurant_id);

  if (error) return settings;

  return { ...settings, is_open: false };
}
