import { redirect } from "next/navigation";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { getRestaurantSettings } from "@/features/settings/queries";
import { SettingsForm } from "@/features/settings/components/settings-form";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) redirect("/dashboard");

  const settings = await getRestaurantSettings(restaurantId);

  return <SettingsForm initial={settings} />;
}
