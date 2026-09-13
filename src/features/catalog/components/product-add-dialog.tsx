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
import { resolveMenuImage } from "@/lib/menu-image-overrides";
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
        pricingMode: group.pricing_mode,
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

/** Sabor 1 obrigatório + 2º sabor opcional (meio a meio) — mesmo padrão iFood/99. */
function FlavorPicker({
  group,
  selected,
  onPick,
  onClearSecond,
}: {
  group: OptionGroupWithItems;
  selected: SelectedOptions;
  onPick: (slot: 0 | 1, itemId: string) => void;
  onClearSecond: () => void;
}) {
  const items = group.product_option_items;
  const pickedIds = Object.keys(selected[group.id] ?? {});
  const flavor1Id = pickedIds[0];
  const flavor2Id = pickedIds[1];
  const [wantsSecond, setWantsSecond] = useState(!!flavor2Id);

  const flavor1 = items.find((i) => i.id === flavor1Id);
  const flavor2 = items.find((i) => i.id === flavor2Id);
  const finalPriceCents = flavor2
    ? Math.max(flavor1?.price_cents ?? 0, flavor2.price_cents)
    : (flavor1?.price_cents ?? null);

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Sabor 1
        </Label>
        <div className="space-y-1.5">
          {items.map((item) => (
            <RadioRow
              key={item.id}
              label={item.name}
              priceCents={item.price_cents}
              checked={flavor1Id === item.id}
              onClick={() => onPick(0, item.id)}
            />
          ))}
        </div>
      </div>

      {flavor1Id && (
        <div className="space-y-2 border-t pt-3">
          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm font-medium">🍕 Meio a meio — adicionar 2º sabor</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={wantsSecond}
              onChange={(e) => {
                if (e.target.checked) setWantsSecond(true);
                else {
                  setWantsSecond(false);
                  onClearSecond();
                }
              }}
            />
          </label>

          {wantsSecond && (
            <div>
              <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Sabor 2
              </Label>
              <div className="space-y-1.5">
                {items
                  .filter((item) => item.id !== flavor1Id)
                  .map((item) => (
                    <RadioRow
                      key={item.id}
                      label={item.name}
                      priceCents={item.price_cents}
                      checked={flavor2Id === item.id}
                      onClick={() => onPick(1, item.id)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {flavor2
          ? `Meio a meio: o valor final é do sabor mais caro — ${formatBRL(finalPriceCents!)}.`
          : flavor1
            ? `Sabor único — ${formatBRL(finalPriceCents!)}. Ative acima para dividir com um 2º sabor.`
            : "Escolha o sabor 1 para continuar."}
      </p>
    </div>
  );
}

function RadioRow({
  label,
  priceCents,
  checked,
  onClick,
}: {
  label: string;
  priceCents: number;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
      ].join(" ")}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <span
          className={[
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
            checked ? "border-primary" : "border-muted-foreground/40",
          ].join(" ")}
        >
          {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
        </span>
        {label}
      </span>
      {priceCents > 0 && (
        <span className="text-xs text-muted-foreground">{formatBRL(priceCents)}</span>
      )}
    </button>
  );
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {open ? (
          <ProductAddDialogBody
            key={product.id}
            product={product}
            restaurantId={restaurantId}
            restaurantSlug={restaurantSlug}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProductAddDialogBody({
  product,
  restaurantId,
  restaurantSlug,
  onOpenChange,
}: {
  product: Product;
  restaurantId: string;
  restaurantSlug: string;
  onOpenChange: (open: boolean) => void;
}) {
  const addItem = useCart((s) => s.addItem);
  const [groups, setGroups] = useState<OptionGroupWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedOptions>({});
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const basePrice = effectivePriceCents(product);
  const imageUrl = resolveMenuImage(product.slug, product.image_url);

  useEffect(() => {
    let cancelled = false;

    fetchProductOptionsAction(product.id)
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Não foi possível carregar as opções.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product.id]);

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

  function toggleMaxPrice(group: OptionGroupWithItems, optionItemId: string) {
    setSelected((prev) => {
      const current = { ...(prev[group.id] ?? {}) };
      if ((current[optionItemId] ?? 0) > 0) {
        delete current[optionItemId];
        return { ...prev, [group.id]: current };
      }

      if (groupTotal(group.id, prev) + 1 > group.max_qty) {
        toast.error(`Escolha até ${group.max_qty} em ${group.name}.`);
        return prev;
      }

      current[optionItemId] = 1;
      return { ...prev, [group.id]: current };
    });
  }

  function pickFlavorSlot(group: OptionGroupWithItems, slot: 0 | 1, optionItemId: string) {
    setSelected((prev) => {
      const pickedIds = Object.keys(prev[group.id] ?? {});
      const next: Record<string, number> = {};
      if (slot === 0) {
        next[optionItemId] = 1;
        if (pickedIds[1] && pickedIds[1] !== optionItemId) next[pickedIds[1]] = 1;
      } else {
        if (pickedIds[0]) next[pickedIds[0]] = 1;
        next[optionItemId] = 1;
      }
      return { ...prev, [group.id]: next };
    });
  }

  function clearFlavorSlot2(group: OptionGroupWithItems) {
    setSelected((prev) => {
      const pickedIds = Object.keys(prev[group.id] ?? {});
      const next: Record<string, number> = {};
      if (pickedIds[0]) next[pickedIds[0]] = 1;
      return { ...prev, [group.id]: next };
    });
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
        imageUrl,
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
    <>
      <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
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
            groups.map((group) => {
              const isMaxPrice = group.pricing_mode === "max_price";
              const isFlavorPicker = isMaxPrice && group.max_qty === 2;

              if (isFlavorPicker) {
                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">{group.name}</Label>
                      {group.is_required && (
                        <span className="text-xs text-destructive">Obrigatório</span>
                      )}
                    </div>
                    <FlavorPicker
                      group={group}
                      selected={selected}
                      onPick={(slot, itemId) => pickFlavorSlot(group, slot, itemId)}
                      onClearSecond={() => clearFlavorSlot2(group)}
                    />
                  </div>
                );
              }

              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">{group.name}</Label>
                    {group.is_required && (
                      <span className="text-xs text-destructive">Obrigatório</span>
                    )}
                  </div>
                  {isMaxPrice && (
                    <p className="text-xs text-muted-foreground">
                      Escolha até {group.max_qty} — o preço final é o do sabor mais caro escolhido.
                    </p>
                  )}

                  <div className="space-y-2">
                    {group.product_option_items.map((item) => {
                      const qty = selected[group.id]?.[item.id] ?? 0;
                      const isSingle = group.type === "single";
                      const isStepper = !isSingle && !isMaxPrice;
                      const active = qty > 0;

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
                                : isMaxPrice
                                  ? toggleMaxPrice(group, item.id)
                                  : adjustMultiple(group, item.id, qty > 0 ? 0 : 1)
                            }
                          >
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.price_cents > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {isMaxPrice ? formatBRL(item.price_cents) : `+${formatBRL(item.price_cents)}`}
                              </span>
                            )}
                          </button>

                          {isStepper && (
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
              );
            })
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
    </>
  );
}
