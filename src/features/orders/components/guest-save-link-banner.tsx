"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mostrado só pra convidados: sem login, essa URL é a ÚNICA forma de voltar ao pedido. */
export function GuestSaveLinkBanner() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — usuário pode copiar da barra de endereço mesmo
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <strong>Salve este link!</strong> Como você não fez login, é por ele que você
        acompanha o pedido — se sair da página, não tem outra forma de voltar.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-300 bg-white hover:bg-amber-100"
        onClick={copyLink}
      >
        {copied ? (
          <>
            <Check className="mr-1.5 h-4 w-4" /> Copiado!
          </>
        ) : (
          <>
            <Link2 className="mr-1.5 h-4 w-4" /> Copiar link
          </>
        )}
      </Button>
    </div>
  );
}
