import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMenuBySlug } from "@/features/catalog/queries";
import { getSession } from "@/features/auth/get-session";
import { CheckoutForm } from "@/features/orders/components/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

interface Props {
  params: Promise<{ restaurantSlug: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { restaurantSlug } = await params;
  const [menu, { user, profile }] = await Promise.all([
    getMenuBySlug(restaurantSlug),
    getSession(),
  ]);
  if (!menu) notFound();

  const s = menu.settings;

  return (
    <CheckoutForm
      settings={{
        restaurantId: menu.restaurant.id,
        deliveryFeeCents: s?.delivery_fee_cents ?? 0,
        freeDeliveryAboveCents: s?.free_delivery_above_cents ?? null,
        minOrderCents: s?.min_order_cents ?? 0,
        paymentMethods: s?.payment_methods ?? ["pix", "cash", "card"],
        acceptsDelivery: s?.accepts_delivery ?? true,
        acceptsPickup: s?.accepts_pickup ?? true,
        defaultName: profile?.full_name ?? "",
        defaultPhone: profile?.phone ?? "",
        isLoggedIn: !!user,
      }}
    />
  );
}
