"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStep1Action } from "../actions";

const ESTABLISHMENT_TYPES = [
  { value: "restaurant", label: "Restaurante" },
  { value: "pizzeria",   label: "Pizzaria" },
  { value: "hamburger",  label: "Hamburgueria" },
  { value: "japanese",   label: "Japonês / Sushi" },
  { value: "italian",    label: "Italiano" },
  { value: "bakery",     label: "Padaria / Confeitaria" },
  { value: "bar",        label: "Bar / Petiscaria" },
  { value: "cafe",       label: "Café" },
  { value: "fast_food",  label: "Fast Food" },
  { value: "other",      label: "Outro" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar →"}
    </Button>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function Step1Form({ defaultName = "", defaultSlug = "" }: { defaultName?: string; defaultSlug?: string }) {
  const [state, formAction] = useActionState(saveStep1Action, { ok: true } as never);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.ok && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do estabelecimento *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          placeholder="Ex: Pizzaria do Zé"
          required
          maxLength={100}
          onChange={(e) => {
            const slugInput = document.getElementById("slug") as HTMLInputElement;
            if (slugInput && !slugInput.dataset.edited) {
              slugInput.value = slugify(e.target.value);
            }
          }}
        />
      </div>

      {/* Slug / endereço */}
      <div className="space-y-1.5">
        <Label htmlFor="slug">Endereço no app *</Label>
        <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground shrink-0">nenos.app/</span>
          <input
            id="slug"
            name="slug"
            defaultValue={defaultSlug}
            placeholder="pizzaria-do-ze"
            required
            maxLength={60}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
            onInput={(e) => {
              (e.target as HTMLInputElement).dataset.edited = "1";
              (e.target as HTMLInputElement).value = slugify((e.target as HTMLInputElement).value);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Apenas letras minúsculas, números e hífens.</p>
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <Label>Tipo de estabelecimento *</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ESTABLISHMENT_TYPES.map((t) => (
            <label
              key={t.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:font-semibold"
            >
              <input type="radio" name="establishment_type" value={t.value} className="accent-primary" required />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* Culinária */}
      <div className="space-y-1.5">
        <Label htmlFor="cuisine">Tipo de culinária *</Label>
        <Input id="cuisine" name="cuisine" placeholder="Ex: Italiana, Brasileira, Árabe..." required maxLength={80} />
      </div>

      {/* Faixa de preço */}
      <div className="space-y-2">
        <Label>Faixa de preço *</Label>
        <div className="flex gap-3">
          {[
            { v: "1", label: "$",    desc: "Econômico" },
            { v: "2", label: "$$",   desc: "Moderado" },
            { v: "3", label: "$$$",  desc: "Premium" },
            { v: "4", label: "$$$$", desc: "Luxo" },
          ].map((p) => (
            <label
              key={p.v}
              className="flex flex-1 cursor-pointer flex-col items-center rounded-xl border px-2 py-2.5 text-center transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input type="radio" name="price_range" value={p.v} className="sr-only" required />
              <span className="font-bold">{p.label}</span>
              <span className="text-[10px] text-muted-foreground">{p.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição breve <span className="text-muted-foreground">(opcional)</span></Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          placeholder="Conte brevemente sobre o seu negócio..."
          className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
