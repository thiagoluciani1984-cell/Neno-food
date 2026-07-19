import type { Metadata } from "next";
import Image from "next/image";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { getDashboardMetrics } from "@/features/dashboard/queries";
import { getReportSummary } from "@/features/reports/queries";
import { DashboardKpiGrid } from "@/features/dashboard/components/dashboard-kpi-grid";
import { RevenueChartCard } from "@/features/dashboard/components/revenue-chart-card";
import type { KpiData } from "@/features/dashboard/components/kpi-card";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Visão geral" };

export default async function DashboardHome() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const [m, report] = await Promise.all([
    getDashboardMetrics(restaurantId),
    getReportSummary(restaurantId, 14),
  ]);

  const kpis: KpiData[] = [
    {
      id: "orders-today",
      label: "Pedidos hoje",
      value: m.ordersToday.toString(),
      icon: "orders",
      tint: "text-blue-600 bg-blue-50",
    },
    {
      id: "revenue-today",
      label: "Faturamento hoje",
      value: formatBRL(m.revenueTodayCents),
      icon: "revenue",
      tint: "text-green-600 bg-green-50",
    },
    {
      id: "avg-ticket",
      label: "Ticket médio",
      value: formatBRL(m.avgTicketCents),
      icon: "ticket",
      tint: "text-amber-600 bg-amber-50",
    },
    {
      id: "in-progress",
      label: "Em andamento",
      value: m.inProgress.toString(),
      icon: "in-progress",
      tint: "text-orange-600 bg-orange-50",
    },
    {
      id: "active-customers",
      label: "Clientes ativos hoje",
      value: m.activeCustomers.toString(),
      icon: "customers",
      tint: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            Bem-vindo de volta! <span className="inline-block animate-nenos-soft-float">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a operação do seu restaurante em tempo real.
          </p>
        </div>
        <Image
          src="/brand/mascot/chef.webp"
          alt=""
          width={900}
          height={491}
          className="hidden h-20 w-auto shrink-0 sm:block"
          priority
        />
      </div>

      <DashboardKpiGrid kpis={kpis} />

      <RevenueChartCard data={report.dailyRevenue} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersTable
              orders={m.recentOrders.map((o) => ({
                id: o.id,
                order_number: o.order_number,
                customer_name: o.customer_name,
                status: o.status,
                total_cents: o.total_cents,
                created_at: o.created_at,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mais vendidos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {m.topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            )}
            {m.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {i + 1}
                  </span>
                  {p.name}
                </span>
                <Badge variant="secondary">{p.quantity} un.</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
