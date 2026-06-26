import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pagamento aprovado | Nenos Food" };

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <div className="container flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">Pagamento aprovado!</h1>
        <p className="mt-2 text-muted-foreground">
          Seu pedido foi confirmado e o restaurante já está preparando tudo.
        </p>
      </div>

      <div className="flex gap-3">
        {order && (
          <Button asChild>
            <Link href={`/order/${order}`}>Acompanhar pedido</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
