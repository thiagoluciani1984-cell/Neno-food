import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/infra/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/features/orders/components/order-tracker";
import { formatBRL } from "@/lib/money";
import type { OrderWithItems } from "@/types/database.types";

export const metadata: Metadata = { title: "Acompanhar pedido" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single<OrderWithItems>();

  if (!order) notFound();

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground">Pedido</p>
        <h1 className="font-serif text-3xl font-bold">#{order.order_number}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Acompanhe em tempo real</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTracker orderId={order.id} initialStatus={order.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}× {item.product_name}
              </span>
              <span>{formatBRL(item.total_cents)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatBRL(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Entrega</span>
            <span>{formatBRL(order.delivery_fee_cents)}</span>
          </div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Desconto</span>
              <span>-{formatBRL(order.discount_cents)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatBRL(order.total_cents)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <Link href="/">Voltar ao cardápio</Link>
        </Button>
      </div>
    </div>
  );
}
