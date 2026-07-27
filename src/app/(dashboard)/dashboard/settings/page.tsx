import { redirect } from "next/navigation";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { getRestaurantSettings } from "@/features/settings/queries";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { isAsaasConfigured, isAsaasDevMock } from "@/lib/payments";
import { createClient } from "@/infra/supabase/server";
import type { EstablishmentType } from "@/core/domain/value-objects/establishment-type";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) redirect("/dashboard");

  const supabase = await createClient();
  const [settings, { data: restaurant }] = await Promise.all([
    getRestaurantSettings(restaurantId),
    supabase
      .from("restaurants")
      .select("cuisine, establishment_type")
      .eq("id", restaurantId)
      .single<{ cuisine: string; establishment_type: EstablishmentType }>(),
  ]);

  return (
    <SettingsForm
      initial={settings}
      restaurant={{
        cuisine: restaurant?.cuisine ?? "",
        establishment_type: restaurant?.establishment_type ?? "restaurant",
      }}
      asaasConfigured={isAsaasConfigured()}
      asaasDevMock={isAsaasDevMock()}
    />
  );
}
