import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { getRestaurantStaff } from "@/features/staff/queries";
import { StaffPage } from "@/features/staff/components/staff-page";

export const metadata: Metadata = { title: "Equipe" };

export default async function StaffManagementPage() {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) redirect("/dashboard");

  const members = await getRestaurantStaff(profile.restaurant_id);

  return (
    <div className="space-y-1 pb-10">
      <h1 className="text-2xl font-bold">Equipe</h1>
      <p className="text-sm text-muted-foreground">
        Gerencie os membros que têm acesso ao painel do seu restaurante.
      </p>
      <div className="pt-4">
        <StaffPage initialMembers={members} />
      </div>
    </div>
  );
}
