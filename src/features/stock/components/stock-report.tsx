import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import type { StockConsumptionRow } from "@/features/stock/queries";

export function StockReport({
  rows,
  totalCostCents,
  days,
}: {
  rows: StockConsumptionRow[];
  totalCostCents: number;
  days: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <CardTitle>Consumo de insumos</CardTitle>
            <CardDescription>Baixas por venda e manuais nos últimos {days} dias.</CardDescription>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button key={d} asChild size="sm" variant={days === d ? "default" : "outline"}>
                <Link href={`/dashboard/estoque?dias=${d}`}>{d}d</Link>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem consumo registrado no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 pr-4">Insumo</th>
                  <th className="pb-2 pr-4">Quantidade consumida</th>
                  <th className="pb-2 text-right">Custo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.itemName} className="border-b last:border-0">
                    <td className="py-2 pr-4">{row.itemName}</td>
                    <td className="py-2 pr-4">{row.quantity}</td>
                    <td className="py-2 text-right font-medium">{formatBRL(row.totalCostCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end border-t pt-3">
          <p className="text-lg font-bold">
            Custo total: <span className="text-primary">{formatBRL(totalCostCents)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
