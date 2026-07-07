"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-xl font-bold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Não foi possível carregar esta página. Tente novamente em instantes.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
