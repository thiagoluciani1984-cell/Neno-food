import { Lock, Clock } from "lucide-react";
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

type Lote = {
  key: string;
  label: string;
  isOpen: boolean;
  entries: SupplyEntry[];
  totalCents: number;
};

function groupByLote(entries: SupplyEntry[]): Lote[] {
  const approved = entries.filter((e) => e.status === "approved");

  const openEntries = approved.filter((e) => !e.paid_at);
  const closedByPaidAt = new Map<string, SupplyEntry[]>();
  for (const entry of approved) {
    if (!entry.paid_at) continue;
    const group = closedByPaidAt.get(entry.paid_at);
    if (group) group.push(entry);
    else closedByPaidAt.set(entry.paid_at, [entry]);
  }

  const lotes: Lote[] = [];

  if (openEntries.length > 0) {
    lotes.push({
      key: "open",
      label: "Lote em aberto",
      isOpen: true,
      entries: openEntries,
      totalCents: openEntries.reduce((sum, e) => sum + e.total_cents, 0),
    });
  }

  const closedLotes = Array.from(closedByPaidAt.entries())
    .map(([paidAt, batchEntries]) => ({
      key: paidAt,
      label: `Fechado em ${formatDateTime(paidAt)}`,
      isOpen: false,
      entries: batchEntries,
      totalCents: batchEntries.reduce((sum, e) => sum + e.total_cents, 0),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));

  return [...lotes, ...closedLotes];
}

export function SupplyReport({ entries }: { entries: SupplyEntry[] }) {
  const lotes = groupByLote(entries);
  const grandTotalCents = lotes.reduce((sum, l) => sum + l.totalCents, 0);

  if (lotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Nenhum lançamento aprovado ainda — só entra aqui depois que é aprovado.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <p className="text-sm font-semibold">Total geral (todos os lotes)</p>
          <p className="text-lg font-bold text-primary">{formatBRL(grandTotalCents)}</p>
        </CardContent>
      </Card>

      {lotes.map((lote) => (
        <Card key={lote.key}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {lote.isOpen ? (
                  <Clock className="h-4 w-4 text-amber-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                {lote.label}
              </CardTitle>
              <Badge variant={lote.isOpen ? "warning" : "muted"}>
                {lote.entries.length} lançamento(s) · {formatBRL(lote.totalCents)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {lote.entries.map((entry) => (
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
