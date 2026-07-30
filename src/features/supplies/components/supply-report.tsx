import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import type { SupplyReportRow } from "@/features/supplies/queries";

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function SupplyReport({ rows, totalCents }: { rows: SupplyReportRow[]; totalCents: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de insumos aprovados</CardTitle>
        <CardDescription>Só entra aqui depois que o lançamento é aprovado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento aprovado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 pr-4">Mês</th>
                  <th className="pb-2 pr-4">Item</th>
                  <th className="pb-2 pr-4">Quantidade</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.month}-${row.itemName}`} className="border-b last:border-0">
                    <td className="py-2 pr-4 capitalize">{formatMonth(row.month)}</td>
                    <td className="py-2 pr-4">{row.itemName}</td>
                    <td className="py-2 pr-4">{row.quantity}</td>
                    <td className="py-2 text-right font-medium">{formatBRL(row.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end border-t pt-3">
          <p className="text-lg font-bold">
            Total geral: <span className="text-primary">{formatBRL(totalCents)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
