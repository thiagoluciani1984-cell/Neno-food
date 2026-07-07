"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Bell, SlidersHorizontal, ShoppingBag, User, Search } from "lucide-react";
import { fadeInMotion } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/use-cart";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useMounted } from "@/lib/use-mounted";
import type { Notification } from "@/types/database.types";

export function StoreHeader({
  showNotifications = false,
  notifications = [],
  unreadCount = 0,
}: {
  showNotifications?: boolean;
  notifications?: Notification[];
  unreadCount?: number;
}) {
  const items = useCart((s) => s.items);
  const restaurantSlug = useCart((s) => s.restaurantSlug);
  const mounted = useMounted();

  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;
  const cartHref = restaurantSlug ? `/${restaurantSlug}/cart` : "/cart";
  const headerVariants = useNenosVariants(fadeInMotion);

  return (
    <motion.header
      variants={headerVariants}
      initial="initial"
      animate="animate"
      className="sticky top-0 z-40 border-b border-orange-100/80 bg-white/95 backdrop-blur-xl"
    >
      <div className="container flex h-14 items-center justify-between gap-3 sm:h-16">
        <Logo size="sm" className="sm:hidden" />
        <Logo className="hidden sm:flex" />

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50/80 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-orange-100 sm:flex"
        >
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Entregar em casa
        </button>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {showNotifications && (
            <NotificationBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />
          )}
          {!showNotifications && (
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-orange-50 hover:text-primary"
          >
            <Link href="/account" aria-label="Minha conta">
              <User className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            asChild
            className="relative hidden gap-2 rounded-full bg-gradient-to-r from-primary to-[#FB923C] px-4 font-bold text-white shadow-md shadow-primary/25 hover:opacity-95 sm:inline-flex"
          >
            <Link href={cartHref}>
              <ShoppingBag className="h-4 w-4" />
              <span>Carrinho</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </nav>
      </div>
    </motion.header>
  );
}

/** Barra de busca reutilizável (homepage) */
export function MarketplaceSearchBar({
  value,
  onChange,
  onFilterClick,
}: {
  value: string;
  onChange: (v: string) => void;
  onFilterClick?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar restaurante ou prato..."
          className="h-12 w-full rounded-2xl border border-orange-100 bg-white pl-11 pr-4 text-sm font-medium shadow-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/25"
        />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25"
        aria-label="Filtros"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
}
