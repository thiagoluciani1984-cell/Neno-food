"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Minus, Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/money";
import { fetchProductOptionsAction } from "@/features/catalog/actions-options-fetch";
import { useCart } from "@/features/cart/use-cart";
import {
  buildCartLineId,
  cartItemUnitPriceCents,
  effectivePriceCents,
} from "@/core/domain/entities/cart";
import type { CartItemOption } from "@/core/domain/entities/cart";
import type { OptionGroupWithItems } from "@/features/catalog/queries-options";
import type { Product } from "@/types/database.types";

type SelectedOptions = Record<string, Record<string, number>>;

function groupTotal(groupId: string, selected: SelectedOptions): number {
  const group = selected[groupId];
  if (!group) return 0;
  return Object.values(group).reduce((sum, qty) => sum + qty, 0);
}

function buildSnapshots(
  groups: OptionGroupWithItems[],
  selected: SelectedOptions
): CartItemOption[] {
  const snapshots: CartItemOption[] = [];

  for (const group of groups) {
    const picks = selected[group.id] ?? {};
    for (const [optionItemId, quantity] of Object.entries(picks)) {
      if (quantity <= 0) continue;
      const optionItem = group.product_option_items.find(
        (item) => item.id === optionItemId
      );
      if (!optionItem) continue;
      snapshots.push({
        optionId: group.id,
        optionItemId: optionItem.id,
        optionName: group.name,
        optionItemName: optionItem.name,
        unitPriceCents: optionItem.price_cents,
        quantity,
      });
    }
  }

  return snapshots;
}

function validateSelection(
  groups: OptionGroupWithItems[],
  selected: SelectedOptions,
  productName: string
): string | null {
  for (const group of groups) {
    const total = groupTotal(group.id, selected);
    if (group.is_required && total < Math.max(1, group.min_qty)) {
      return `Selecione ${group.name}.`;
    }
    if (total > group.max_qty) {
      return `Limite de ${group.name} excedido.`;
    }
    if (group.type === "single" && total > 1) {
      return `Escolha apenas uma opção em ${group.name}.`;
    }
  }

  if (!productName) return null;
  return null;
}

export function ProductAddDialog({
  product,
  restaurantId,
  restaurantSlug,
  open,
  onOpenChange,
}: {
  product: Product;
  restaurantId: string;
  restaurantSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addItem = useCart((s) => s.addItem);
  const [groups, setGroups] = useState<OptionGroupWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedOptions>({});
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const basePrice = effectivePriceCents(product);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setSelected({});
    setNotes("");
    setQuantity(1);

    fetchProductOptionsAction(product.id)
      .then((data) => setGroups(data))
      .catch(() => toast.error("Não foi possível carregar as opções."))
      .finally(() => setLoading(false));
  }, [open, product.id]);

  const snapshots = useMemo(
    () => buildSnapshots(groups, selected),
    [groups, selected]
  );
  const unitPrice = cartItemUnitPriceCents(basePrice, snapshots);

  function toggleSingle(group: OptionGroupWithItems, optionItemId: string) {
    setSelected((prev) => ({
      ...prev,
      [group.id]: { [optionItemId]: 1 },
    }));
  }

  function adjustMultiple(
    group: OptionGroupWithItems,
    optionItemId: string,
    delta: number
  ) {
    setSelected((prev) => {
      const current = { ...(prev[group.id] ?? {}) };
      const nextQty = Math.max(0, (current[optionItemId] ?? 0) + delta);
      const totalWithout = groupTotal(group.id, prev) - (current[optionItemId] ?? 0);

      if (delta > 0 && totalWithout + nextQty > group.max_qty) {
        toast.error(`Máximo de ${group.max_qty} em ${group.name}.`);
        return prev;
      }

      if (nextQty <= 0) delete current[optionItemId];
      else current[optionItemId] = nextQty;

      return { ...prev, [group.id]: current };
    });
  }

  function handleAdd() {
    const validationError = validateSelection(groups, selected, product.name);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const lineId = buildCartLineId(product.id, snapshots);
    addItem(
      {
        lineId,
        productId: product.id,
        name: product.name,
        basePriceCents: basePrice,
        unitPriceCents: unitPrice,
        quantity,
        imageUrl: product.image_url,
        notes: notes || undefined,
        options: snapshots,
      },
      restaurantId,
      restaurantSlug
    );

    toast.success("Item adicionado");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              {product.description && (
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
              <p className="text-lg font-bold text-primary">
                {formatBRL(basePrice)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando opções...
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">{group.name}</Label>
                  {group.is_required && (
                    <span className="text-xs text-destructive">Obrigatório</span>
                  )}
                </div>

                <div className="space-y-2">
                  {group.product_option_items.map((item) => {
                    const qty = selected[group.id]?.[item.id] ?? 0;
                    const isSingle = group.type === "single";
                    const active = isSingle ? qty > 0 : qty > 0;

                    return (
                      <div
                        key={item.id}
                        className={[
                          "flex items-center justify-between rounded-lg border px-3 py-2",
                          active ? "border-primary bg-primary/5" : "",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() =>
                            isSingle
                              ? toggleSingle(group, item.id)
                              : adjustMultiple(group, item.id, qty > 0 ? 0 : 1)
                          }
                        >
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.price_cents > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              +{formatBRL(item.price_cents)}
                            </span>
                          )}
                        </button>

                        {!isSingle && (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => adjustMultiple(group, item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-4 text-center text-sm">{qty}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => adjustMultiple(group, item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: sem cebola, bem assada..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center font-medium">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="font-bold text-primary">
              {formatBRL(unitPrice * quantity)}
            </span>
          </div>

          <Button className="w-full" onClick={handleAdd} disabled={loading}>
            Adicionar ao carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
