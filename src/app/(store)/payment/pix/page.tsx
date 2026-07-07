import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOrderPaymentView } from "@/features/orders/queries-payment";
import { PixPaymentView } from "@/features/orders/components/pix-payment-view";

export const metadata: Metadata = { title: "Pagamento PIX | Nenos Food" };

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function PixPaymentPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const view = await getOrderPaymentView(orderId);
  if (!view) notFound();

  if (view.order.payment_status === "paid" || view.order.status === "received") {
    redirect(`/payment/success?order=${orderId}`);
  }

  const payload = view.payment?.provider_payload as
    | { qr_code?: string; qr_code_url?: string; expires_at?: string; mock?: boolean }
    | null;

  if (!payload?.qr_code && !payload?.qr_code_url) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold">Pagamento não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          Não foi possível carregar o QR Code deste pedido.
        </p>
        <Button asChild className="mt-6">
          <Link href={`/order/${orderId}`}>Ver pedido</Link>
        </Button>
      </div>
    );
  }

  return (
    <PixPaymentView
      orderId={view.order.id}
      orderNumber={view.order.order_number}
      totalCents={view.order.total_cents}
      initialStatus={view.order.status}
      pix={payload}
    />
  );
}
