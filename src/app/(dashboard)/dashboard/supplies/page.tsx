import { redirect } from "next/navigation";
import { getActiveRestaurantId, getDashboardRestaurantSummary, getSession } from "@/features/auth/get-session";
import { listSupplyItems, listSupplyEntries, getPartnerRestaurant } from "@/features/supplies/queries";
import { SuppliesDashboard } from "@/features/supplies/components/supplies-dashboard";

export const metadata = { title: "Insumos" };

export default async function SuppliesPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) redirect("/dashboard");

  const { profile } = await getSession();

  const [restaurant, items, entries, partner] = await Promise.all([
    getDashboardRestaurantSummary(),
    listSupplyItems(restaurantId),
    listSupplyEntries(restaurantId),
    getPartnerRestaurant(restaurantId),
  ]);

  const [partnerItems, partnerEntries] = partner
    ? await Promise.all([listSupplyItems(partner.id), listSupplyEntries(partner.id)])
    : [[], []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Insumos <span className="text-primary">— {restaurant?.name ?? "Restaurante"}</span>
        </h1>
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
        partner={partner}
        partnerItems={partnerItems}
        partnerEntries={partnerEntries}
      />
    </div>
  );
}
