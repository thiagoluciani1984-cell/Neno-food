"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStep3Action } from "../actions";

type Defaults = {
  cnpj?: string;
  chef_name?: string;
  history?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar →"}
    </Button>
  );
}

function formatCNPJ(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function Step3Form({ defaults = {} }: { defaults?: Defaults }) {
  const [state, formAction] = useActionState(saveStep3Action, { ok: true } as never);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.ok && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      {/* Aviso de segurança */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          Suas informações são criptografadas e armazenadas com segurança. Nunca compartilhamos seus dados com terceiros.
        </p>
      </div>

      {/* CNPJ */}
      <div className="space-y-1.5">
        <Label htmlFor="cnpj">CNPJ *</Label>
        <Input
          id="cnpj"
          name="cnpj"
          defaultValue={defaults.cnpj}
          placeholder="00.000.000/0001-00"
          required
          maxLength={18}
          onInput={(e) => {
            (e.target as HTMLInputElement).value = formatCNPJ((e.target as HTMLInputElement).value);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Pessoa Física (MEI) ou Jurídica. Usamos para verificar a regularidade do seu negócio.
        </p>
      </div>

      {/* Responsável */}
      <div className="space-y-1.5">
        <Label htmlFor="chef_name">Nome do responsável *</Label>
        <Input
          id="chef_name"
          name="chef_name"
          defaultValue={defaults.chef_name}
          placeholder="Nome completo do proprietário ou responsável"
          required
          maxLength={100}
        />
      </div>

      {/* História */}
      <div className="space-y-1.5">
        <Label htmlFor="history">
          História do seu restaurante <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <textarea
          id="history"
          name="history"
          rows={4}
          defaultValue={defaults.history}
          maxLength={1000}
          placeholder="Conte a história do seu negócio — isso aparecerá no seu perfil público..."
          className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-muted-foreground">Máximo 1.000 caracteres.</p>
      </div>

      <SubmitButton />
    </form>
  );
}
