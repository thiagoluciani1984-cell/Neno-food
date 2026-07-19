"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryDialog } from "./category-dialog";
import { ProductDialog } from "./product-dialog";
import {
  deleteCategoryAction,
  deleteProductAction,
  toggleProductAvailabilityAction,
} from "@/features/catalog/actions";
import { formatBRL } from "@/lib/money";
import { resolveMenuImage } from "@/lib/menu-image-overrides";
import type { Category, Product } from "@/types/database.types";

export function MenuManager({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const [availability, setAvailability] = useState<Record<string, boolean>>(
    Object.fromEntries(products.map((p) => [p.id, p.is_available]))
  );

  async function toggle(id: string, value: boolean) {
    setAvailability((s) => ({ ...s, [id]: value }));
    const res = await toggleProductAvailabilityAction(id, value);
    if (!res.ok) {
      setAvailability((s) => ({ ...s, [id]: !value }));
      toast.error("Não foi possível atualizar.");
    }
  }

  async function removeProduct(id: string) {
    const res = await deleteProductAction(id);
    toast[res.ok ? "success" : "error"](
      res.ok ? "Produto removido." : res.error ?? "Erro."
    );
  }

  async function removeCategory(id: string) {
    const res = await deleteCategoryAction(id);
    toast[res.ok ? "success" : "error"](
      res.ok ? "Categoria removida." : res.error ?? "Erro."
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cardápio</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie categorias e produtos.
          </p>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Produtos */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <ProductDialog
              categories={categories}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> Novo produto
                </Button>
              }
            />
          </div>

          <div className="grid gap-3">
            {products.map((product) => {
              const cat = categories.find((c) => c.id === product.category_id);
              const imageUrl = resolveMenuImage(product.slug, product.image_url);
              return (
                <Card key={product.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <UtensilsCrossed className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {cat && <Badge variant="outline">{cat.name}</Badge>}
                        {product.is_featured && <Badge variant="gold">Destaque</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.promo_price_cents != null ? (
                          <>
                            <span className="font-medium text-primary">
                              {formatBRL(product.promo_price_cents)}
                            </span>{" "}
                            <span className="line-through">
                              {formatBRL(product.price_cents)}
                            </span>
                          </>
                        ) : (
                          formatBRL(product.price_cents)
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={availability[product.id] ?? product.is_available}
                          onCheckedChange={(v) => toggle(product.id, v)}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {availability[product.id] ? "Ativo" : "Pausado"}
                        </span>
                      </div>

                      <ProductDialog
                        product={product}
                        categories={categories}
                        trigger={
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {products.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum produto cadastrado.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <CategoryDialog
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> Nova categoria
                </Button>
              }
            />
          </div>

          <div className="grid gap-3">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!cat.is_active && <Badge variant="secondary">Inativa</Badge>}
                    <CategoryDialog
                      category={cat}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeCategory(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {categories.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma categoria cadastrada.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
