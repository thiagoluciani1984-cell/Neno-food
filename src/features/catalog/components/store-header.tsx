"use client";

import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/use-cart";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;
  const cartHref = restaurantSlug ? `/${restaurantSlug}/cart` : "/cart";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground hover:text-primary sm:inline-flex"
          >
            <Link href="/feed">Feed</Link>
          </Button>
          {showNotifications && (
            <NotificationBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />
          )}

          {/* Conta */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-primary/5 hover:text-primary"
          >
            <Link href="/account" aria-label="Minha conta">
              <User className="h-5 w-5" />
            </Link>
          </Button>

          {/* Carrinho */}
          <Button
            asChild
            className="relative rounded-full bg-[#1f1f1f] px-4 font-semibold text-white shadow-none hover:bg-primary"
          >
            <Link href={cartHref}>
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Carrinho</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
