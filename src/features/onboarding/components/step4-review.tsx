"use client";

import { useTransition } from "react";
import { Loader2, CheckCircle2, Store, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitForReviewAction } from "../actions";

interface ReviewData {
  name: string;
  cuisine: string;
  establishment_type: string;
  city: string;
  state: string;
  cnpj: string;
  chef_name: string;
}

export function Step4Review({ data }: { data: ReviewData }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      await submitForReviewAction();
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Revise as informações abaixo antes de enviar para análise. Nossa equipe irá verificar seus dados em até <strong>2 dias úteis</strong>.
      </p>

      {/* Resumo */}
      <div className="divide-y rounded-2xl border overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Estabelecimento</p>
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm text-muted-foreground">{data.cuisine} · {data.establishment_type}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Localização</p>
            <p className="font-semibold">{data.city} — {data.state}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3.5">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Dados jurídicos</p>
            <p className="font-semibold">{data.chef_name}</p>
            <p className="text-sm text-muted-foreground">CNPJ: {data.cnpj}</p>
          </div>
        </div>
      </div>

      {/* Termos */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-primary" id="terms" />
        <span className="text-sm text-muted-foreground">
          Confirmo que as informações acima são verídicas e concordo com os{" "}
          <a href="#" className="font-medium text-primary underline underline-offset-2">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="#" className="font-medium text-primary underline underline-offset-2">
            Política de Privacidade
          </a>{" "}
          da Nenos Food.
        </span>
      </label>

      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={() => {
          const terms = document.getElementById("terms") as HTMLInputElement;
          if (!terms?.checked) {
            terms?.reportValidity();
            return;
          }
          handleSubmit();
        }}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Enviar para análise
          </>
        )}
      </Button>
    </div>
  );
}
