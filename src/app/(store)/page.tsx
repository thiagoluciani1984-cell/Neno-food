import {
  listActiveRestaurants,
  searchMarketplaceProducts,
} from "@/features/catalog/queries-marketplace";
import { MarketplaceContent } from "@/features/catalog/components/marketplace-content";

interface Props {
  searchParams: Promise<{ busca?: string }>;
}

export default async function MarketplacePage({ searchParams }: Props) {
  const { busca } = await searchParams;
  const initialQuery = busca?.trim() ?? "";

  const [restaurants, productHits] = await Promise.all([
    listActiveRestaurants(),
    initialQuery.length >= 2
      ? searchMarketplaceProducts(initialQuery)
      : Promise.resolve([]),
  ]);

  return (
    <MarketplaceContent
      restaurants={restaurants}
      initialQuery={initialQuery}
      initialProductHits={productHits}
    />
  );
}
