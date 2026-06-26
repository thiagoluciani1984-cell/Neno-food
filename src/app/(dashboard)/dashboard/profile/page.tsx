import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { getRestaurantProfile } from "@/features/restaurant-profile/queries";
import { ProfileForm } from "@/features/restaurant-profile/components/profile-form";

export const metadata: Metadata = { title: "Perfil do restaurante" };

export default async function ProfilePage() {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) redirect("/dashboard");

  const data = await getRestaurantProfile(profile.restaurant_id);
  if (!data) redirect("/dashboard");

  return (
    <div className="space-y-1 pb-10">
      <h1 className="text-2xl font-bold">Perfil público</h1>
      <p className="text-sm text-muted-foreground">
        Estas informações aparecem para os clientes na plataforma.
      </p>
      <div className="pt-4">
        <ProfileForm data={data} />
      </div>
    </div>
  );
}
