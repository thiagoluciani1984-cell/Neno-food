"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Bell, ChevronDown, SlidersHorizontal, ShoppingBag, User, Search } from "lucide-react";
import { fadeInMotion } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      className="sticky top-0 z-40 border-b border-orange-100/50 bg-white/90 shadow-[0_12px_40px_-30px_rgba(87,44,16,0.35)] backdrop-blur-xl"
    >
      <div className="container flex h-[74px] max-w-[1240px] items-center justify-between gap-2 sm:h-20 sm:gap-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Nenos Food — início">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-orange-50 shadow-md shadow-primary/15 sm:h-14 sm:w-14">
            <Image
              src="/brand/mascot/home-hero.png"
              alt=""
              fill
              sizes="56px"
              className="scale-[1.22] object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.3]"
              priority
            />
          </span>
          <span className="leading-none">
            <span className="block text-[20px] font-black tracking-[-0.06em] text-primary sm:text-2xl">
              Nenos
            </span>
            <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.28em] text-amber-500 sm:text-[10px]">
              Food
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/account?aba=enderecos"
            aria-label="Escolher endereço de entrega"
            className="flex items-center gap-2 rounded-full border border-orange-100 bg-white px-2.5 py-2 text-left shadow-[0_10px_28px_-18px_rgba(75,39,17,0.4)] transition-colors hover:border-primary/30 hover:bg-orange-50 sm:px-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-primary sm:h-9 sm:w-9">
              <MapPin className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <span className="hidden leading-tight min-[390px]:block">
              <span className="block text-[9px] font-semibold text-muted-foreground sm:text-[10px]">Entregar em</span>
              <span className="flex items-center gap-0.5 text-xs font-black text-primary sm:text-sm">
                Casa <ChevronDown className="h-3 w-3" />
              </span>
            </span>
          </Link>

          {showNotifications && (
            <NotificationBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />
          )}
          {!showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-[#4d443e] hover:bg-orange-50 hover:text-primary"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-primary" />
            </Button>
          )}

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden rounded-full text-muted-foreground hover:bg-orange-50 hover:text-primary sm:inline-flex"
          >
            <Link href="/account" aria-label="Minha conta">
              <User className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            asChild
            className="relative hidden gap-2 rounded-full bg-[#171717] px-5 font-bold text-white shadow-md shadow-black/20 hover:bg-[#262626] sm:inline-flex"
          >
            <Link href={cartHref}>
              <ShoppingBag className="h-4 w-4" />
              <span>Carrinho</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

/** Barra de busca reutilizável (homepage) */
export function MarketplaceSearchBar({
  value,
  onChange,
  onFilterClick,
  filtersOpen = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onFilterClick?: () => void;
  filtersOpen?: boolean;
}) {
  return (
    <div className="flex gap-2.5 rounded-[26px] bg-white p-1.5 shadow-[0_20px_55px_-30px_rgba(77,39,16,0.5)] ring-1 ring-orange-100/80 sm:p-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b817a] sm:left-5" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Busque comidas e restaurantes..."
          className="h-12 w-full rounded-[20px] border-0 bg-transparent pl-11 pr-3 text-sm font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-[#9a918b] focus:ring-0 sm:h-14 sm:pl-12"
        />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-all sm:h-14 sm:w-14",
          filtersOpen
            ? "rotate-90 bg-[#241d18] shadow-black/20"
            : "bg-gradient-to-br from-[#ff7b00] to-[#ff4d00] shadow-primary/30 hover:scale-105"
        )}
        aria-label="Filtros"
        aria-expanded={filtersOpen}
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
}
