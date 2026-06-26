import { listActiveRestaurants } from "@/features/catalog/queries-marketplace";
import { MarketplaceContent } from "@/features/catalog/components/marketplace-content";

export default async function MarketplacePage() {
  const list = await listActiveRestaurants();
  return <MarketplaceContent restaurants={list} />;
}
