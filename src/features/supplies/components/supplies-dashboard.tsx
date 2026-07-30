"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SupplyEntryForm } from "./supply-entry-form";
import { SupplyEntriesList } from "./supply-entries-list";
import { SupplyItemManager } from "./supply-item-manager";
import { SupplyReport } from "./supply-report";
import type { SupplyItem, SupplyEntry } from "@/types/database.types";
import type { SupplyReportRow } from "@/features/supplies/queries";

export function SuppliesDashboard({
  restaurantId,
  items,
  entries,
  report,
  isMasterAdmin,
}: {
  restaurantId: string;
  items: SupplyItem[];
  entries: SupplyEntry[];
  report: { rows: SupplyReportRow[]; totalCents: number };
  isMasterAdmin: boolean;
}) {
  return (
    <Tabs defaultValue="lancar" className="space-y-4">
      <TabsList>
        <TabsTrigger value="lancar">Lançar</TabsTrigger>
        <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
        <TabsTrigger value="relatorio">Relatório</TabsTrigger>
      </TabsList>

      <TabsContent value="lancar" className="space-y-4">
        <SupplyEntryForm items={items} />
        <SupplyEntriesList
          restaurantId={restaurantId}
          initialEntries={entries}
          isMasterAdmin={isMasterAdmin}
        />
      </TabsContent>

      <TabsContent value="catalogo">
        <SupplyItemManager items={items} />
      </TabsContent>

      <TabsContent value="relatorio">
        <SupplyReport rows={report.rows} totalCents={report.totalCents} />
      </TabsContent>
    </Tabs>
  );
}
