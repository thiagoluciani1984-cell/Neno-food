import type { Metadata } from "next";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { getManagedCatalog } from "@/features/catalog/queries";
import { MenuManager } from "@/features/catalog/components/menu-manager";

export const metadata: Metadata = { title: "Cardápio" };

export default async function MenuPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const { categories, products } = await getManagedCatalog(restaurantId);

  return <MenuManager categories={categories} products={products} />;
}
