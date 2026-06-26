import type { Metadata } from "next";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import type { Order, PaymentMethod } from "@/types/database.types";

export const metadata: Metadata = { title: "Relatórios" };

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  online: "Online",
};

export default async function ReportsPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const supabase = await createClient();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("total_cents, payment_method, status, created_at")
    .eq("restaurant_id", restaurantId)
    .neq("status", "cancelled")
    .gte("created_at", monthAgo.toISOString());

  const list = (orders ?? []) as Pick<
    Order,
    "total_cents" | "payment_method" | "status" | "created_at"
  >[];

  const revenue = list.reduce((s, o) => s + o.total_cents, 0);
  const count = list.length;
  const avgTicket = count > 0 ? Math.round(revenue / count) : 0;

  const byPayment = new Map<PaymentMethod, number>();
  for (const o of list) {
    byPayment.set(o.payment_method, (byPayment.get(o.payment_method) ?? 0) + o.total_cents);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Últimos 30 dias.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-2xl font-bold">{formatBRL(revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Pedidos</p>
            <p className="text-2xl font-bold">{count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="text-2xl font-bold">{formatBRL(avgTicket)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formas de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...byPayment.entries()].map(([method, value]) => (
            <div key={method} className="flex items-center justify-between">
              <Badge variant="outline">{PAYMENT_LABEL[method]}</Badge>
              <span className="font-semibold">{formatBRL(value)}</span>
            </div>
          ))}
          {byPayment.size === 0 && (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
