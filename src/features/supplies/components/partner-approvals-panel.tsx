"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient, getRealtimeAuthReady } from "@/infra/supabase/client";
import { SupplyEntriesList } from "./supply-entries-list";
import type { SupplyItem, SupplyEntry } from "@/types/database.types";

export function PartnerApprovalsPanel({
  partnerRestaurantId,
  partnerName,
  items,
  entries: initialEntries,
  viewerProfileId,
}: {
  partnerRestaurantId: string;
  partnerName: string;
  items: SupplyItem[];
  entries: SupplyEntry[];
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
        .channel(`supply-entries-partner-${partnerRestaurantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "supply_entries",
            filter: `restaurant_id=eq.${partnerRestaurantId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as SupplyEntry;
              setEntries((prev) => [row, ...prev]);
              toast.info(`${partnerName} lançou: ${row.item_name}`);
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
  }, [partnerRestaurantId, partnerName]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Lançamentos feitos pelo <strong>{partnerName}</strong> — o lote fica no relatório dele, mas cabe a você
        aprovar ou rejeitar confirmando o que recebeu.
      </p>
      <SupplyEntriesList
        entries={entries}
        items={items}
        isMasterAdmin={false}
        viewerProfileId={viewerProfileId}
        showBatchControl={false}
        allowDelete={false}
      />
    </div>
  );
}
