"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient, getRealtimeAuthReady } from "@/infra/supabase/client";
import { formatBRL } from "@/lib/money";
import { UNIT_TYPE_LABELS } from "@/features/supplies/schemas";
import {
  approveSupplyEntryAction,
  rejectSupplyEntryAction,
  deleteSupplyEntryAction,
} from "@/features/supplies/actions";
import type { SupplyEntry } from "@/types/database.types";

const STATUS_BADGE: Record<SupplyEntry["status"], { label: string; variant: "warning" | "success" | "destructive" }> = {
  pending: { label: "Pendente", variant: "warning" },
  approved: { label: "Aprovado", variant: "success" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function SupplyEntriesList({
  restaurantId,
  initialEntries,
  isMasterAdmin,
}: {
  restaurantId: string;
  initialEntries: SupplyEntry[];
  isMasterAdmin: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function handleApprove(id: string) {
    setBusyId(id);
    const res = await approveSupplyEntryAction(id);
    setBusyId(null);
    if (res.ok) toast.success("Lançamento aprovado!");
    else toast.error(res.error);
  }

  async function handleReject(id: string) {
    setBusyId(id);
    const res = await rejectSupplyEntryAction(id);
    setBusyId(null);
    if (res.ok) toast.success("Lançamento rejeitado.");
    else toast.error(res.error);
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    const res = await deleteSupplyEntryAction(id);
    setBusyId(null);
    if (res.ok) toast.success("Lançamento excluído.");
    else toast.error(res.error);
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Nenhum lançamento ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const badge = STATUS_BADGE[entry.status];
        const busy = busyId === entry.id;
        return (
          <div
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{entry.item_name}</p>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.quantity} {UNIT_TYPE_LABELS[entry.unit_type]} · {formatBRL(entry.total_cents)} · pego em{" "}
                {formatDate(entry.taken_at)}
                {entry.notes ? ` · ${entry.notes}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {entry.status === "pending" && isMasterAdmin && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    onClick={() => handleApprove(entry.id)}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(entry.id)}
                    disabled={busy}
                  >
                    <X className="h-4 w-4" />
                    Rejeitar
                  </Button>
                </>
              )}
              {entry.status === "pending" && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Excluir"
                  onClick={() => handleDelete(entry.id)}
                  disabled={busy}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
