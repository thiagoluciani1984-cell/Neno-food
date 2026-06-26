"use client";

import { useActionState, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Camera, ImageIcon, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveProfileAction, uploadRestaurantImageAction } from "../actions";
import type { RestaurantProfileData } from "../queries";

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
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar perfil"}
    </Button>
  );
}

export function ProfileForm({ data }: { data: RestaurantProfileData }) {
  const [state, formAction] = useActionState(saveProfileAction, { ok: true } as never);

  const [logoUrl, setLogoUrl]   = useState(data.logo_url ?? "");
  const [coverUrl, setCoverUrl] = useState(data.cover_url ?? "");
  const [uploadingLogo,  setUploadingLogo]  = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const logoRef  = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(
    file: File,
    type: "logo" | "cover",
    setUploading: (v: boolean) => void,
    setUrl: (v: string) => void
  ) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadRestaurantImageAction(fd, type);
    setUploading(false);
    if (res.ok) {
      setUrl(res.url);
      toast.success(type === "logo" ? "Logo atualizado!" : "Capa atualizada!");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* hidden fields para URLs das imagens */}
      <input type="hidden" name="logo_url"  value={logoUrl} />
      <input type="hidden" name="cover_url" value={coverUrl} />

      {state && !state.ok && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      {state?.ok === true && (state as { ok: true; _saved?: boolean })._saved && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Perfil salvo com sucesso!
        </p>
      )}

      {/* ── Imagens ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Imagens do perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Cover */}
          <div className="space-y-2">
            <Label>Foto de capa (16:9)</Label>
            <div
              className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/40 transition-colors"
              onClick={() => coverRef.current?.click()}
            >
              {coverUrl ? (
                <Image src={coverUrl} alt="Capa" fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-sm">Clique para adicionar capa</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                {uploadingCover
                  ? <Loader2 className="h-8 w-8 text-white animate-spin" />
                  : <Camera className="h-8 w-8 text-white" />
                }
              </div>
              <input
                ref={coverRef} type="file" className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f, "cover", setUploadingCover, setCoverUrl);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo (quadrado)</Label>
            <div className="flex items-center gap-4">
              <div
                className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/40 transition-colors"
                onClick={() => logoRef.current?.click()}
              >
                {logoUrl ? (
                  <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                  {uploadingLogo
                    ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                    : <Camera className="h-5 w-5 text-white" />
                  }
                </div>
                <input
                  ref={logoRef} type="file" className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f, "logo", setUploadingLogo, setLogoUrl);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Recomendado: 400×400px</p>
                <p>JPG, PNG ou WebP • máx. 5MB</p>
                {data.is_verified && (
                  <Badge variant="verified" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verificado
                  </Badge>
                )}
                {data.avg_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{data.avg_rating.toFixed(1)}</span>
                    <span className="text-xs">({data.total_reviews} avaliações)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Informações básicas ─────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Informações básicas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nome do estabelecimento *</Label>
              <Input id="name" name="name" defaultValue={data.name} required maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cuisine">Culinária *</Label>
              <Input id="cuisine" name="cuisine" defaultValue={data.cuisine} required maxLength={80} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="establishment_type">Tipo *</Label>
              <select
                id="establishment_type"
                name="establishment_type"
                defaultValue={data.establishment_type}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {ESTABLISHMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Faixa de preço</Label>
              <div className="flex gap-2">
                {[
                  { v: "1", label: "$"    },
                  { v: "2", label: "$$"   },
                  { v: "3", label: "$$$"  },
                  { v: "4", label: "$$$$" },
                ].map((p) => (
                  <label
                    key={p.v}
                    className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border py-2 text-sm font-bold transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio" name="price_range" value={p.v}
                      defaultChecked={data.price_range === Number(p.v)}
                      className="sr-only"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chef_name">Responsável</Label>
              <Input id="chef_name" name="chef_name" defaultValue={data.chef_name ?? ""} maxLength={100} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição breve</Label>
            <textarea
              id="description" name="description" rows={2} maxLength={500}
              defaultValue={data.description ?? ""}
              className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="history">Nossa história</Label>
            <textarea
              id="history" name="history" rows={4} maxLength={1000}
              defaultValue={data.history ?? ""}
              placeholder="Conte a história do seu restaurante..."
              className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Contato e redes sociais ─────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Contato e redes sociais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={data.phone ?? ""} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={data.whatsapp ?? ""} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail público</Label>
            <Input id="email" name="email" type="email" defaultValue={data.email ?? ""} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" defaultValue={data.instagram ?? ""} placeholder="@seuperfil" maxLength={100} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="website">Site</Label>
            <Input id="website" name="website" type="url" defaultValue={data.website ?? ""} placeholder="https://" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
