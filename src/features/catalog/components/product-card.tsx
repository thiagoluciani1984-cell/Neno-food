"use client";

import Image from "next/image";
import { Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { useCart } from "@/features/cart/use-cart";
import { effectivePriceCents } from "@/core/domain/entities/cart";
import type { Product } from "@/types/database.types";

export function ProductCard({
  product,
  restaurantId,
}: {
  product: Product;
  restaurantId: string;
}) {
  const addItem = useCart((s) => s.addItem);
  const price = effectivePriceCents(product);
  const hasPromo = product.promo_price_cents != null;

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        unitPriceCents: price,
        quantity: 1,
        imageUrl: product.image_url,
      },
      restaurantId
    );
    toast.success(`${product.name} adicionado ao carrinho`);
  }

  return (
    <div className="group flex min-h-[132px] gap-4 rounded-lg border bg-white p-3 transition-all hover:border-primary/30 hover:shadow-md">
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
          className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-[#1f1f1f] shadow-md hover:bg-primary"
          aria-label={`Adicionar ${product.name}`}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
