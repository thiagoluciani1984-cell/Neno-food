import type { Metadata } from "next";
import { getDashboardRestaurantId } from "@/features/auth/get-session";
import { getActiveOrders } from "@/features/orders/queries";
import { OrdersBoard } from "@/features/orders/components/orders-board";

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
      <OrdersBoard restaurantId={restaurantId} initialOrders={orders} />
    </div>
  );
}
