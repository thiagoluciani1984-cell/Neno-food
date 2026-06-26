"use client";

import Link from "next/link";
import { ShoppingBag, User, Bell } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/use-cart";
import { useEffect, useState } from "react";

export function StoreHeader() {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="flex items-center gap-1">
          {/* Notificações */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground hover:bg-primary/5 hover:text-primary"
            aria-label="Notificacoes"
          >
            <Bell className="h-5 w-5" />
          </Button>

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
            <Link href="/cart">
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
