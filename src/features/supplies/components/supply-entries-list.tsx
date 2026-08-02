"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, Trash2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import { UNIT_TYPE_LABELS } from "@/features/supplies/schemas";
import {
  approveSupplyEntryAction,
  rejectSupplyEntryAction,
  deleteSupplyEntryAction,
  closeSupplyBatchAction,
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
  entries,
  isMasterAdmin,
  viewerProfileId,
}: {
  entries: SupplyEntry[];
  isMasterAdmin: boolean;
  viewerProfileId: string | null;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const openBatch = useMemo(
    () => entries.filter((e) => e.status === "approved" && !e.paid_at),
    [entries]
  );
  const openBatchTotalCents = openBatch.reduce((sum, e) => sum + e.total_cents, 0);

  // Lote pago já fechado sai daqui — fica só na aba "Lotes fechados".
  const visibleEntries = useMemo(
    () => entries.filter((e) => !(e.status === "approved" && e.paid_at)),
    [entries]
  );

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

  async function handleCloseBatch() {
    if (openBatch.length === 0) return;
    const confirmed = window.confirm(
      `Fechar o lote atual? ${openBatch.length} lançamento(s) — ${formatBRL(openBatchTotalCents)} — serão marcados como pagos e travados. Novos lançamentos começam um lote novo automaticamente.`
    );
    if (!confirmed) return;

    setClosing(true);
    const res = await closeSupplyBatchAction();
    setClosing(false);
    if (res.ok) toast.success(`Lote fechado! ${res.count} lançamento(s) marcados como pagos.`);
    else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      {isMasterAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-semibold">Lote atual (em aberto)</p>
              <p className="text-xs text-muted-foreground">
                {openBatch.length === 0
                  ? "Nenhum lançamento aprovado aguardando pagamento."
                  : `${openBatch.length} lançamento(s) aprovado(s) · total ${formatBRL(openBatchTotalCents)}`}
              </p>
            </div>
            <Button onClick={handleCloseBatch} disabled={closing || openBatch.length === 0}>
              {closing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Fechar lote (marcar como pago)
            </Button>
          </CardContent>
        </Card>
      )}

      {visibleEntries.length === 0 && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Nenhum lançamento ativo no momento.</CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {visibleEntries.map((entry) => {
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
                {entry.status === "pending" &&
                  (isMasterAdmin || entry.created_by !== viewerProfileId) && (
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
    </div>
  );
}
