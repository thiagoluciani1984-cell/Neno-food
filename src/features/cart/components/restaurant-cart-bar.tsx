"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { bottomBarMotion } from "@/lib/motion/nenos-motion";
import { useCart } from "@/features/cart/use-cart";
import { formatBRL } from "@/lib/money";
import { useMounted } from "@/lib/use-mounted";

type CartSummaryBarProps = {
  restaurantSlug: string;
  count: number;
  subtotal: number;
};

export function CartSummaryBar({ restaurantSlug, count, subtotal }: CartSummaryBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20">
        <Image src="/brand/logo.png" alt="" width={36} height={36} className="object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">
          {count} {count === 1 ? "item" : "itens"} no carrinho
        </p>
        <p className="text-lg font-extrabold">{formatBRL(subtotal)}</p>
      </div>
      <Link
        href={`/${restaurantSlug}/cart`}
        className="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-primary shadow-sm"
      >
        <ShoppingBag className="h-4 w-4" />
        Ver carrinho
      </Link>
    </div>
  );
}

export function RestaurantCartBar({ restaurantSlug }: { restaurantSlug: string }) {
  const items = useCart((s) => s.items);
  const slug = useCart((s) => s.restaurantSlug);
  const subtotal = useCart((s) => s.subtotalCents());
  const mounted = useMounted();

  const cartItems = items.reduce((s, i) => s + i.quantity, 0);
  const visible = mounted && slug === restaurantSlug && cartItems > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={bottomBarMotion}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-20 left-4 right-4 z-40 rounded-3xl bg-nenos-gradient p-4 text-white shadow-orange-lg md:bottom-4 md:z-50"
        >
          <CartSummaryBar
            restaurantSlug={restaurantSlug}
            count={cartItems}
            subtotal={subtotal}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
