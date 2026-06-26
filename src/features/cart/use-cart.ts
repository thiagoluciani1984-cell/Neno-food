"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/core/domain/entities/cart";
import { cartItemCount, cartSubtotalCents } from "@/core/domain/entities/cart";

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (item: CartItem, restaurantId: string) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  itemCount: () => number;
  subtotalCents: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      items: [],

      addItem: (item, restaurantId) =>
        set((state) => {
          // carrinho é por restaurante; trocar de restaurante zera o carrinho
          const base =
            state.restaurantId && state.restaurantId !== restaurantId
              ? []
              : state.items;

          const existing = base.find((i) => i.productId === item.productId);
          const items = existing
            ? base.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              )
            : [...base, item];

          return { items, restaurantId };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i
                ),
        })),

      clear: () => set({ items: [], restaurantId: null }),

      itemCount: () => cartItemCount(get().items),
      subtotalCents: () => cartSubtotalCents(get().items),
    }),
    { name: "nenos-cart" }
  )
);
