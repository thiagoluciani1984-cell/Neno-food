"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StockItemManager } from "./stock-item-manager";
import { StockRecipeEditor } from "./stock-recipe-editor";
import { StockMovementsList } from "./stock-movements-list";
import { StockReport } from "./stock-report";
import type { StockItem, StockMovement } from "@/types/database.types";
import type { StockRecipeWithNames, StockConsumptionRow } from "@/features/stock/queries";

export function StockDashboard({
  restaurantId,
  items,
  movements,
  recipes,
  products,
  report,
  days,
}: {
  restaurantId: string;
  items: StockItem[];
  movements: StockMovement[];
  recipes: StockRecipeWithNames[];
  products: { id: string; name: string }[];
  report: { rows: StockConsumptionRow[]; totalCostCents: number };
  days: number;
}) {
  return (
    <Tabs defaultValue="movimentacoes" className="space-y-4">
      <TabsList>
        <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        <TabsTrigger value="insumos">Insumos</TabsTrigger>
        <TabsTrigger value="ficha-tecnica">Ficha técnica</TabsTrigger>
        <TabsTrigger value="relatorio">Relatório</TabsTrigger>
      </TabsList>

      <TabsContent value="movimentacoes">
        <StockMovementsList restaurantId={restaurantId} items={items} initialMovements={movements} />
      </TabsContent>

      <TabsContent value="insumos">
        <StockItemManager items={items} />
      </TabsContent>

      <TabsContent value="ficha-tecnica">
        <StockRecipeEditor items={items} products={products} recipes={recipes} />
      </TabsContent>

      <TabsContent value="relatorio">
        <StockReport rows={report.rows} totalCostCents={report.totalCostCents} days={days} />
      </TabsContent>
    </Tabs>
  );
}
