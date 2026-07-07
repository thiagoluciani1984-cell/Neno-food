import type { Metadata } from "next";
import Link from "next/link";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { getReportSummary } from "@/features/reports/queries";
import { ExportCsvButton } from "@/features/reports/components/export-csv-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import type { PaymentMethod } from "@/types/database.types";

export const metadata: Metadata = { title: "Relatórios" };

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  online: "Online",
};

interface Props {
  searchParams: Promise<{ dias?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const { dias } = await searchParams;
  const days = Math.min(90, Math.max(7, Number(dias) || 30));

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const report = await getReportSummary(restaurantId, days);

  const csvRows: string[][] = [
    ["Métrica", "Valor"],
    ["Período (dias)", String(days)],
    ["Faturamento", formatBRL(report.revenue)],
    ["Pedidos", String(report.orderCount)],
    ["Ticket médio", formatBRL(report.avgTicket)],
    ["Cancelados", String(report.cancelledCount)],
    ["Entregas", String(report.byType.delivery)],
    ["Retiradas", String(report.byType.pickup)],
    [],
    ["Forma de pagamento", "Valor"],
    ...report.byPayment.map(([method, value]) => [PAYMENT_LABEL[method], formatBRL(value)]),
    [],
    ["Produto", "Qtd", "Receita"],
    ...report.topProducts.map((p) => [p.name, String(p.quantity), formatBRL(p.revenue)]),
    [],
    ["Data", "Pedidos", "Faturamento"],
    ...report.dailyRevenue.map((d) => [
      d.date,
      String(d.orders),
      formatBRL(d.revenue),
    ]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Últimos {days} dias.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              asChild
              size="sm"
              variant={days === d ? "default" : "outline"}
            >
              <Link href={`/dashboard/reports?dias=${d}`}>{d}d</Link>
            </Button>
          ))}
          <ExportCsvButton
            rows={csvRows}
            filename={`relatorio-${days}d.csv`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-2xl font-bold">{formatBRL(report.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Pedidos</p>
            <p className="text-2xl font-bold">{report.orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="text-2xl font-bold">{formatBRL(report.avgTicket)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Cancelados</p>
            <p className="text-2xl font-bold">{report.cancelledCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.byPayment.map(([method, value]) => (
              <div key={method} className="flex items-center justify-between">
                <Badge variant="outline">{PAYMENT_LABEL[method]}</Badge>
                <span className="font-semibold">{formatBRL(value)}</span>
              </div>
            ))}
            {report.byPayment.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Entrega</span>
              <span className="font-semibold">{report.byType.delivery}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Retirada</span>
              <span className="font-semibold">{report.byType.pickup}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.topProducts.map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.quantity} vendidos</p>
              </div>
              <span className="shrink-0 font-semibold">{formatBRL(p.revenue)}</span>
            </div>
          ))}
          {report.topProducts.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
          )}
        </CardContent>
      </Card>

      {report.dailyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.dailyRevenue.slice(-14).map((day) => (
              <div key={day.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted-foreground">
                  {new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max(
                        4,
                        (day.revenue / Math.max(...report.dailyRevenue.map((d) => d.revenue))) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-medium">
                  {formatBRL(day.revenue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
