import type { Metadata } from "next";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Flame,
} from "lucide-react";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { getDashboardMetrics } from "@/features/dashboard/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/core/domain/value-objects/order-status";

export const metadata: Metadata = { title: "Visão geral" };

export default async function DashboardHome() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const m = await getDashboardMetrics(restaurantId);

  const kpis = [
    {
      label: "Pedidos hoje",
      value: m.ordersToday.toString(),
      icon: ShoppingBag,
      tint: "text-blue-600 bg-blue-50",
    },
    {
      label: "Faturamento hoje",
      value: formatBRL(m.revenueTodayCents),
      icon: DollarSign,
      tint: "text-green-600 bg-green-50",
    },
    {
      label: "Ticket médio",
      value: formatBRL(m.avgTicketCents),
      icon: TrendingUp,
      tint: "text-amber-600 bg-amber-50",
    },
    {
      label: "Em andamento",
      value: m.inProgress.toString(),
      icon: Flame,
      tint: "text-orange-600 bg-orange-50",
    },
    {
      label: "Clientes ativos hoje",
      value: m.activeCustomers.toString(),
      icon: Users,
      tint: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe a operação do seu restaurante em tempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-lg p-2.5 ${kpi.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {m.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            )}
            {m.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">#{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.customer_name ?? "Cliente"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={ORDER_STATUS_COLOR[o.status]}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </Badge>
                  <span className="font-semibold">{formatBRL(o.total_cents)}</span>
                </div>
              </div>
            ))}
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
