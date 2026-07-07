"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductAddButton } from "@/components/shared/product-add-button";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { useCart } from "@/features/cart/use-cart";
import {
  buildCartLineId,
  effectivePriceCents,
} from "@/core/domain/entities/cart";
import { fetchProductOptionsAction } from "@/features/catalog/actions-options-fetch";
import { ProductAddDialog } from "./product-add-dialog";
import { productHighlightMotion } from "@/lib/motion/nenos-motion";
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
  const setQuantity = useCart((s) => s.setQuantity);
  const items = useCart((s) => s.items);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingOptions, setCheckingOptions] = useState(false);
  const [wasAdded, setWasAdded] = useState(false);
  const deepLinkHandled = useRef(false);
  const price = effectivePriceCents(product);
  const hasPromo = product.promo_price_cents != null;
  const isHighlighted = deepLinkSlug === product.slug;
  const lineId = buildCartLineId(product.id);
  const cartItem = items.find((i) => i.lineId === lineId);
  const qty = cartItem?.quantity ?? 0;

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
          lineId,
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
      toast.success("Item adicionado");
      setWasAdded(true);
      window.setTimeout(() => setWasAdded(false), 420);
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
        if (options.length > 0 && isOpen) setDialogOpen(true);
      } catch {
        // ignore
      }
    })();
  }, [isHighlighted, isOpen, product.id, product.slug]);

  return (
    <>
      <motion.div
        id={`product-${product.slug}`}
        animate={wasAdded ? "added" : "idle"}
        variants={productHighlightMotion}
        className={cn(
          "group flex gap-4 rounded-3xl border border-orange-100 bg-white p-3 shadow-sm transition-all hover:shadow-md hover-nenos-lift",
          isHighlighted && "ring-2 ring-primary ring-offset-2"
        )}
      >        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-orange-50">
              <UtensilsCrossed className="h-8 w-8 text-primary/25" />
            </div>
          )}
          {product.is_featured && (
            <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">
              Top
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <h3 className="font-extrabold leading-tight text-foreground">{product.name}</h3>
            {product.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <span className="text-base font-extrabold text-primary">{formatBRL(price)}</span>
              {hasPromo && (
                <span className="ml-2 text-xs text-muted-foreground line-through">
                  {formatBRL(product.price_cents)}
                </span>
              )}
            </div>

            {qty > 0 ? (
              <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-orange-50 p-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
                  onClick={() => setQuantity(lineId, qty - 1)}
                  aria-label="Diminuir"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[1.25rem] text-center text-sm font-extrabold text-primary">
                  {qty}
                </span>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                  onClick={handleAdd}
                  disabled={checkingOptions || !isOpen}
                  aria-label="Aumentar"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <ProductAddButton
                wasAdded={wasAdded}
                onClick={handleAdd}
                disabled={checkingOptions || !isOpen}
                aria-label={`Adicionar ${product.name}`}
              />
            )}
          </div>
        </div>
      </motion.div>
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
