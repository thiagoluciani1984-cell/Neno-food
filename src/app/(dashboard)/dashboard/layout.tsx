import { redirect } from "next/navigation";
import {
  getSession,
  getDashboardRestaurantSummary,
  listDashboardRestaurants,
} from "@/features/auth/get-session";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { Topbar } from "@/features/dashboard/components/topbar";
import { RestaurantSwitcher } from "@/features/dashboard/components/restaurant-switcher";

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

  const [restaurant, restaurants] = await Promise.all([
    getDashboardRestaurantSummary(),
    listDashboardRestaurants(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          restaurantName={restaurant?.name ?? "Restaurante"}
          userName={profile?.full_name ?? "Usuário"}
        />
        <div className="border-b bg-background px-6 py-3">
          <RestaurantSwitcher
            restaurants={restaurants}
            activeSlug={restaurant?.slug}
          />
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
