import { redirect } from "next/navigation";
import { getSession, getActiveRestaurantId } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { Topbar } from "@/features/dashboard/components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSession();
  if (!user) redirect("/login?redirect=/dashboard");
  const DASHBOARD_ROLES = ["restaurant", "master_admin", "staff"];
  if (!profile?.role || !DASHBOARD_ROLES.includes(profile.role)) {
    redirect("/");
  }

  const restaurantId = await getActiveRestaurantId();
  let restaurantName = "Di Qualità";
  if (restaurantId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("name")
      .eq("id", restaurantId)
      .single<{ name: string }>();
    if (data) restaurantName = data.name;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar restaurantName={restaurantName} userName={profile?.full_name ?? "Usuário"} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
