"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/core/domain/entities/cart";
import {
  buildCartLineId,
  cartItemCount,
  cartSubtotalCents,
} from "@/core/domain/entities/cart";

interface CartState {
  restaurantId: string | null;
  restaurantSlug: string | null;
  items: CartItem[];
  addItem: (item: CartItem, restaurantId: string, restaurantSlug: string) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  itemCount: () => number;
  subtotalCents: () => number;
}

function normalizeItem(item: CartItem): CartItem {
  return {
    ...item,
    lineId: item.lineId ?? buildCartLineId(item.productId, item.options ?? []),
    options: item.options ?? [],
    basePriceCents: item.basePriceCents ?? item.unitPriceCents,
  };
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantSlug: null,
      items: [],

      addItem: (item, restaurantId, restaurantSlug) =>
        set((state) => {
          const normalized = normalizeItem(item);
          const base =
            state.restaurantId && state.restaurantId !== restaurantId
              ? []
              : state.items.map(normalizeItem);

          const existing = base.find((i) => i.lineId === normalized.lineId);
          const items = existing
            ? base.map((i) =>
                i.lineId === normalized.lineId
                  ? { ...i, quantity: i.quantity + normalized.quantity }
                  : i
              )
            : [...base, normalized];

          return { items, restaurantId, restaurantSlug };
        }),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        })),

      setQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) =>
                  i.lineId === lineId ? { ...i, quantity } : i
                ),
        })),

      clear: () =>
        set({ items: [], restaurantId: null, restaurantSlug: null }),

      itemCount: () => cartItemCount(get().items),
      subtotalCents: () => cartSubtotalCents(get().items),
    }),
    {
      name: "nenos-cart",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<CartState>;
        return {
          restaurantId: state.restaurantId ?? null,
          restaurantSlug: state.restaurantSlug ?? null,
          items: (state.items ?? []).map((item) =>
            normalizeItem(item as CartItem)
          ),
        };
      },
    }
  )
);
