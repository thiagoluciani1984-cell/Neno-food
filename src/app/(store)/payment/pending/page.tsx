import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pagamento pendente | Nenos Food" };

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function PaymentPendingPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <div className="container flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
        <Clock className="h-10 w-10 text-yellow-600" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">Pagamento em análise</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Seu pagamento está sendo processado. Assim que confirmado, seu pedido entrará em
          preparo automaticamente.
        </p>
      </div>

      <div className="flex gap-3">
        {order && (
          <Button asChild>
            <Link href={`/order/${order}`}>Ver pedido</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
