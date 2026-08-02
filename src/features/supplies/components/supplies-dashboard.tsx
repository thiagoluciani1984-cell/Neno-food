"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient, getRealtimeAuthReady } from "@/infra/supabase/client";
import { SupplyEntryForm } from "./supply-entry-form";
import { SupplyEntriesList } from "./supply-entries-list";
import { SupplyItemManager } from "./supply-item-manager";
import { SupplyReport } from "./supply-report";
import type { SupplyItem, SupplyEntry } from "@/types/database.types";

export function SuppliesDashboard({
  restaurantId,
  items,
  entries: initialEntries,
  isMasterAdmin,
  viewerProfileId,
}: {
  restaurantId: string;
  items: SupplyItem[];
  entries: SupplyEntry[];
  isMasterAdmin: boolean;
  viewerProfileId: string | null;
}) {
  const [entries, setEntries] = useState(initialEntries);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void getRealtimeAuthReady().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`supply-entries-${restaurantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "supply_entries",
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as SupplyEntry;
              setEntries((prev) => [row, ...prev]);
              toast.info(`Novo insumo lançado: ${row.item_name}`);
            } else if (payload.eventType === "UPDATE") {
              const row = payload.new as SupplyEntry;
              setEntries((prev) => prev.map((e) => (e.id === row.id ? row : e)));
            } else if (payload.eventType === "DELETE") {
              const row = payload.old as { id: string };
              setEntries((prev) => prev.filter((e) => e.id !== row.id));
            }
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [restaurantId]);

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
          entries={entries}
          isMasterAdmin={isMasterAdmin}
          viewerProfileId={viewerProfileId}
        />
      </TabsContent>

      <TabsContent value="catalogo">
        <SupplyItemManager items={items} />
      </TabsContent>

      <TabsContent value="relatorio">
        <SupplyReport entries={entries} />
      </TabsContent>
    </Tabs>
  );
}
