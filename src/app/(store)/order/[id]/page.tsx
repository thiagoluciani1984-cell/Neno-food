import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/features/orders/components/order-tracker";
import { OrderActiveBanner } from "@/features/orders/components/order-active-banner";
import { OrderPaymentBanner } from "@/features/orders/components/order-payment-banner";
import { DeliveryPinCard } from "@/features/orders/components/delivery-pin-card";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { getDeliveryCodeForOrder, getLatestTrackingPoint } from "@/features/delivery/queries";
import { DeliveryTrackingCard } from "@/features/delivery/components/delivery-tracking-card";
import { getOrderForTracking } from "@/features/orders/queries";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/core/domain/value-objects/order-status";
import type { OrderWithItems, Restaurant } from "@/types/database.types";

export const metadata: Metadata = { title: "Acompanhar pedido" };

type OrderDetail = OrderWithItems & {
  restaurants: Pick<Restaurant, "id" | "name" | "slug" | "logo_url"> | null;
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const order = await getOrderForTracking(id, token);
  if (!order) notFound();

  const deliveryCode =
    order.status === "out_for_delivery" || order.status === "delivered"
      ? await getDeliveryCodeForOrder(order.id)
      : null;

  const trackingPoint =
    order.status === "out_for_delivery" && order.type === "delivery"
      ? await getLatestTrackingPoint(order.id)
      : null;

  const restaurant = Array.isArray(order.restaurants)
    ? order.restaurants[0]
    : order.restaurants;

  const backHref = restaurant?.slug ? `/${restaurant.slug}` : "/";

  return (
    <div className="container max-w-2xl space-y-5 py-6">
      <div>
        <h1 className="text-2xl font-extrabold">Rastreamento do pedido</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe seu pedido em tempo real
        </p>
      </div>

      <OrderActiveBanner
        orderNumber={String(order.order_number)}
        restaurantName={restaurant?.name ?? "Nenos Food"}
        statusLabel={ORDER_STATUS_LABEL[order.status]}
      />

      {order.status === "payment_pending" && (
        <OrderPaymentBanner orderId={order.id} />
      )}

      {deliveryCode && (
        <DeliveryPinCard
          code={deliveryCode.code}
          confirmed={!!deliveryCode.confirmed_at}
        />
      )}

      {order.status === "out_for_delivery" && order.type === "delivery" && (
        <DeliveryTrackingCard
          orderId={order.id}
          deliveryAddress={order.delivery_address}
          initialPoint={trackingPoint}
        />
      )}

      <OrderTracker
        orderId={order.id}
        initialStatus={order.status}
        orderType={order.type}
      />

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo</span>
            <span className="font-medium">
              {order.type === "pickup" ? "Retirada no local" : "Entrega"}
            </span>
          </div>
          {order.delivery_address && (
            <div className="flex gap-2 rounded-lg bg-muted/50 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">
                  {order.delivery_address.street}, {order.delivery_address.number}
                </p>
                <p className="text-muted-foreground">
                  {order.delivery_address.district} — {order.delivery_address.city}/
                  {order.delivery_address.state}
                </p>
                {order.delivery_address.complement && (
                  <p className="text-muted-foreground">
                    {order.delivery_address.complement}
                  </p>
                )}
              </div>
            </div>
          )}
          {order.notes && (
            <div>
              <span className="text-muted-foreground">Observações: </span>
              {order.notes}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.product_name}
                </span>
                <span>{formatBRL(item.total_cents)}</span>
              </div>
              {item.order_item_options?.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-4 text-xs text-muted-foreground">
                  {item.order_item_options.map((opt) => (
                    <li key={opt.id}>
                      + {opt.option_item_name}
                      {opt.unit_price_cents > 0 &&
                        ` (${formatBRL(opt.unit_price_cents)})`}
                    </li>
                  ))}
                </ul>
              )}
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

      {order.status === "delivered" && restaurant && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Avalie seu pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              orderId={order.id}
            />
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button asChild variant="outline">
          <Link href={backHref}>Voltar ao cardápio</Link>
        </Button>
      </div>
    </div>
  );
}
