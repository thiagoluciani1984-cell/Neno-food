import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { UNIT_TYPE_LABELS } from "@/features/supplies/schemas";
import type { SupplyEntry } from "@/types/database.types";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

type Batch = {
  paidAt: string;
  entries: SupplyEntry[];
  totalCents: number;
};

function groupIntoBatches(entries: SupplyEntry[]): Batch[] {
  const paid = entries.filter((e) => e.status === "approved" && e.paid_at);
  const byPaidAt = new Map<string, SupplyEntry[]>();

  for (const entry of paid) {
    const key = entry.paid_at as string;
    const group = byPaidAt.get(key);
    if (group) group.push(entry);
    else byPaidAt.set(key, [entry]);
  }

  return Array.from(byPaidAt.entries())
    .map(([paidAt, batchEntries]) => ({
      paidAt,
      entries: batchEntries,
      totalCents: batchEntries.reduce((sum, e) => sum + e.total_cents, 0),
    }))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

export function SupplyClosedBatches({ entries }: { entries: SupplyEntry[] }) {
  const batches = groupIntoBatches(entries);

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Nenhum lote fechado ainda — os lotes aparecem aqui depois que você usa &quot;Fechar
          lote&quot; na aba Lançar.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => (
        <Card key={batch.paidAt}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Lote fechado em {formatDateTime(batch.paidAt)}
              </CardTitle>
              <Badge variant="muted">
                {batch.entries.length} lançamento(s) · {formatBRL(batch.totalCents)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {batch.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <p>
                  {entry.item_name}{" "}
                  <span className="text-muted-foreground">
                    ({entry.quantity} {UNIT_TYPE_LABELS[entry.unit_type]} · pego em {formatDate(entry.taken_at)})
                  </span>
                </p>
                <span className="shrink-0 font-medium">{formatBRL(entry.total_cents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
