import type { Metadata } from "next";
import { getDashboardRestaurantId } from "@/features/auth/get-session";
import { getActiveOrders } from "@/features/orders/queries";
import { OrdersBoard } from "@/features/orders/components/orders-board";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pedidos" };

export default async function OrdersPage() {
  const restaurantId = await getDashboardRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const orders = await getActiveOrders(restaurantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Painel de produção (KDS) — atualiza em tempo real.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de pedidos ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable
            orders={orders.map((o) => ({
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
      <OrdersBoard restaurantId={restaurantId} initialOrders={orders} />
    </div>
  );
}
