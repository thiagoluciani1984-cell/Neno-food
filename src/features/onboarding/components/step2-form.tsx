"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStep2Action } from "../actions";

type Defaults = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  website?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_district?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar →"}
    </Button>
  );
}

export function Step2Form({ defaults = {} }: { defaults?: Defaults }) {
  const [state, formAction] = useActionState(saveStep2Action, { ok: true } as never);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.ok && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      {/* Contato */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contato</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone *</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone} placeholder="(11) 99999-9999" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={defaults.whatsapp} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" name="email" type="email" defaultValue={defaults.email} placeholder="contato@restaurante.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" defaultValue={defaults.instagram} placeholder="@restaurante" maxLength={100} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Site</Label>
          <Input id="website" name="website" type="url" defaultValue={defaults.website} placeholder="https://meurestaurante.com.br" />
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereço</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address_street">Rua / Avenida *</Label>
            <Input id="address_street" name="address_street" defaultValue={defaults.address_street} placeholder="Rua das Flores" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address_number">Número *</Label>
            <Input id="address_number" name="address_number" defaultValue={defaults.address_number} placeholder="123" required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="address_complement">Complemento</Label>
            <Input id="address_complement" name="address_complement" defaultValue={defaults.address_complement} placeholder="Sala 2, Andar 3..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address_district">Bairro *</Label>
            <Input id="address_district" name="address_district" defaultValue={defaults.address_district} placeholder="Centro" required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="address_zip">CEP *</Label>
            <Input id="address_zip" name="address_zip" defaultValue={defaults.address_zip} placeholder="01001-000" required />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="address_city">Cidade *</Label>
            <Input id="address_city" name="address_city" defaultValue={defaults.address_city} placeholder="São Paulo" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address_state">UF *</Label>
            <Input id="address_state" name="address_state" defaultValue={defaults.address_state} placeholder="SP" maxLength={2} required />
          </div>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
