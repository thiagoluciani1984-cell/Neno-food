import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMenuBySlug } from "@/features/catalog/queries";
import { getSession } from "@/features/auth/get-session";
import { getCustomerAddresses } from "@/features/addresses/queries";
import { getGuestCheckoutDefaults } from "@/features/customers/guest";
import { createClient } from "@/infra/supabase/server";
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
  let savedAddresses: Awaited<ReturnType<typeof getCustomerAddresses>> = [];
  let defaultName = profile?.full_name ?? "";
  let defaultPhone = profile?.phone ?? "";

  if (user) {
    const supabase = await createClient();
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle<{ id: string }>();

    if (customer?.id) {
      savedAddresses = await getCustomerAddresses(customer.id);
    }
  } else {
    const guest = await getGuestCheckoutDefaults();
    if (guest) {
      defaultName = guest.customer.fullName;
      defaultPhone = guest.customer.phone;
      savedAddresses = guest.addresses;
    }
  }

  return (
    <CheckoutForm
      settings={{
        restaurantId: menu.restaurant.id,
        restaurantSlug,
        deliveryFeeCents: s?.delivery_fee_cents ?? 0,
        freeDeliveryAboveCents: s?.free_delivery_above_cents ?? null,
        minOrderCents: s?.min_order_cents ?? 0,
        paymentMethods: s?.payment_methods ?? ["pix", "cash", "card"],
        acceptsDelivery: s?.accepts_delivery ?? true,
        acceptsPickup: s?.accepts_pickup ?? true,
        defaultName,
        defaultPhone,
        isLoggedIn: !!user,
        savedAddresses,
      }}
    />
  );
}
