import { redirect } from "next/navigation";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import {
  listStockItems,
  listStockMovements,
  listStockRecipes,
  listRestaurantProducts,
  getStockConsumptionReport,
} from "@/features/stock/queries";
import { StockDashboard } from "@/features/stock/components/stock-dashboard";

export const metadata = { title: "Estoque" };

interface Props {
  searchParams: Promise<{ dias?: string }>;
}

export default async function EstoquePage({ searchParams }: Props) {
  const { dias } = await searchParams;
  const days = Math.min(90, Math.max(7, Number(dias) || 30));

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) redirect("/dashboard");

  const [items, movements, recipes, products, report] = await Promise.all([
    listStockItems(restaurantId),
    listStockMovements(restaurantId),
    listStockRecipes(restaurantId),
    listRestaurantProducts(restaurantId),
    getStockConsumptionReport(restaurantId, days),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estoque</h1>
        <p className="text-sm text-muted-foreground">
          Controle de insumos, ficha técnica e baixa automática por venda.
        </p>
      </div>

      <StockDashboard
        restaurantId={restaurantId}
        items={items}
        movements={movements}
        recipes={recipes}
        products={products}
        report={report}
        days={days}
      />
    </div>
  );
}
