"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveProductAction,
  uploadProductImageAction,
} from "@/features/catalog/actions";
import { fetchProductOptionsAction } from "@/features/catalog/actions-options-fetch";
import { OptionsEditor } from "@/features/catalog/components/options-editor";
import { reaisToCents, centsToReais } from "@/lib/money";
import type { Category, Product } from "@/types/database.types";
import type { OptionGroupWithItems } from "@/features/catalog/queries-options";

export function ProductDialog({
  product,
  categories,
  trigger,
}: {
  product?: Product;
  categories: Category[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState<OptionGroupWithItems[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && product?.id) {
      fetchProductOptionsAction(product.id).then(setOptions);
    }
  }, [open, product?.id]);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    product?.category_id ?? categories[0]?.id ?? null
  );
  const [price, setPrice] = useState(
    product ? centsToReais(product.price_cents).toString() : ""
  );
  const [promo, setPromo] = useState(
    product?.promo_price_cents != null
      ? centsToReais(product.promo_price_cents).toString()
      : ""
  );
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadProductImageAction(fd);
    setUploading(false);
    if (res.ok && res.url) {
      setImageUrl(res.url);
      toast.success("Imagem enviada.");
    } else {
      toast.error(res.error ?? "Falha no upload.");
    }
  }

  async function onSubmit() {
    setSaving(true);
    const res = await saveProductAction({
      id: product?.id,
      categoryId,
      name,
      description,
      imageUrl: imageUrl || null,
      priceCents: reaisToCents(price),
      promoPriceCents: promo ? reaisToCents(promo) : null,
      isAvailable,
      isFeatured,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Produto salvo.");
      setOpen(false);
    } else {
      toast.error(res.error ?? "Erro ao salvar.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
            {product?.id && (
              <TabsTrigger value="options" className="flex-1">Complementos</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="options" className="mt-4">
            {product?.id && (
              <OptionsEditor productId={product.id} initialGroups={options} />
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-4">
        <div className="space-y-4">
          {/* Imagem */}
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
              {imageUrl ? (
                <Image src={imageUrl} alt={name} fill sizes="96px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar imagem"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={categoryId ?? undefined}
              onValueChange={(v) => setCategoryId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="49,90"
              />
            </div>
            <div className="space-y-2">
              <Label>Promoção (R$)</Label>
              <Input
                inputMode="decimal"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="opcional"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Disponível</Label>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Destaque</Label>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>
        </div>

          <DialogFooter className="mt-4">
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
