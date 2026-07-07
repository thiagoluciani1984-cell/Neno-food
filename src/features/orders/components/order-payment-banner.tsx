import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrderPaymentBanner({ orderId }: { orderId: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-semibold text-amber-900">Pagamento pendente</p>
          <p className="text-sm text-amber-800/80">
            Finalize o PIX para confirmar seu pedido.
          </p>
        </div>
      </div>
      <Button asChild className="shrink-0">
        <Link href={`/payment/pix?order=${orderId}`}>Pagar com PIX</Link>
      </Button>
    </div>
  );
}
