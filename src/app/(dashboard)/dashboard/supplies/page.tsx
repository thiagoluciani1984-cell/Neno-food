import { redirect } from "next/navigation";
import { getActiveRestaurantId, getSession } from "@/features/auth/get-session";
import { listSupplyItems, listSupplyEntries } from "@/features/supplies/queries";
import { SuppliesDashboard } from "@/features/supplies/components/supplies-dashboard";

export const metadata = { title: "Insumos" };

export default async function SuppliesPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) redirect("/dashboard");

  const { profile } = await getSession();

  const [items, entries] = await Promise.all([
    listSupplyItems(restaurantId),
    listSupplyEntries(restaurantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insumos</h1>
        <p className="text-sm text-muted-foreground">
          Controle dos itens retirados, com aprovação antes de contar no relatório.
        </p>
      </div>

      <SuppliesDashboard
        key={restaurantId}
        restaurantId={restaurantId}
        items={items}
        entries={entries}
        isMasterAdmin={profile?.role === "master_admin"}
        viewerProfileId={profile?.id ?? null}
      />
    </div>
  );
}
