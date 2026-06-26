import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pagamento recusado | Nenos Food" };

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function PaymentFailurePage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <div className="container flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-10 w-10 text-red-600" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">Pagamento não aprovado</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Não foi possível processar seu pagamento. Tente novamente ou escolha outra forma de
          pagamento.
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
