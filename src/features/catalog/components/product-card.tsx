"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { useCart } from "@/features/cart/use-cart";
import {
  buildCartLineId,
  effectivePriceCents,
} from "@/core/domain/entities/cart";
import { fetchProductOptionsAction } from "@/features/catalog/actions-options-fetch";
import { ProductAddDialog } from "./product-add-dialog";
import type { Product } from "@/types/database.types";

export function ProductCard({
  product,
  restaurantId,
  restaurantSlug,
  deepLinkSlug,
  isOpen = true,
}: {
  product: Product;
  restaurantId: string;
  restaurantSlug: string;
  deepLinkSlug?: string;
  isOpen?: boolean;
}) {
  const addItem = useCart((s) => s.addItem);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingOptions, setCheckingOptions] = useState(false);
  const deepLinkHandled = useRef(false);
  const price = effectivePriceCents(product);
  const hasPromo = product.promo_price_cents != null;
  const isHighlighted = deepLinkSlug === product.slug;

  async function handleAdd() {
    if (!isOpen) {
      toast.error("Restaurante fechado no momento.");
      return;
    }

    setCheckingOptions(true);
    try {
      const options = await fetchProductOptionsAction(product.id);
      if (options.length > 0) {
        setDialogOpen(true);
        return;
      }

      addItem(
        {
          lineId: buildCartLineId(product.id),
          productId: product.id,
          name: product.name,
          basePriceCents: price,
          unitPriceCents: price,
          quantity: 1,
          imageUrl: product.image_url,
          options: [],
        },
        restaurantId,
        restaurantSlug
      );
      toast.success(`${product.name} adicionado ao carrinho`);
    } catch {
      toast.error("Não foi possível adicionar o produto.");
    } finally {
      setCheckingOptions(false);
    }
  }

  useEffect(() => {
    if (!isHighlighted || deepLinkHandled.current) return;
    deepLinkHandled.current = true;

    const el = document.getElementById(`product-${product.slug}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });

    void (async () => {
      try {
        const options = await fetchProductOptionsAction(product.id);
        if (options.length > 0 && isOpen) {
          setDialogOpen(true);
        }
      } catch {
        // ignore deep link errors
      }
    })();
  }, [isHighlighted, isOpen, product.id, product.slug]);

  return (
    <>
      <div
        id={`product-${product.slug}`}
        className={cn(
          "group flex min-h-[132px] scroll-mt-36 gap-4 rounded-lg border bg-white p-3 transition-all hover:border-primary/30 hover:shadow-md",
          isHighlighted && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="line-clamp-1 font-semibold leading-tight text-foreground">
                {product.name}
              </h3>
              {product.is_featured && <Badge variant="gold">Destaque</Badge>}
            </div>
            {product.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{formatBRL(price)}</span>
            {hasPromo && (
              <span className="text-sm text-muted-foreground line-through">
                {formatBRL(product.price_cents)}
              </span>
            )}
          </div>
        </div>

        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f2f3f5] text-muted-foreground">
              <UtensilsCrossed className="h-7 w-7" />
            </div>
          )}
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={checkingOptions || !isOpen}
            className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-[#1f1f1f] shadow-md hover:bg-primary disabled:opacity-50"
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ProductAddDialog
        product={product}
        restaurantId={restaurantId}
        restaurantSlug={restaurantSlug}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
