"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, Rss, User, ShoppingBag } from "lucide-react";
import { cartFabMotion, bottomNavMotion } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { useCart } from "@/features/cart/use-cart";

const MotionLink = motion.create(Link);

const NAV = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/?busca=1", icon: Search, label: "Busca" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/account", icon: User, label: "Conta" },
] as const;

export function StoreBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasSearch = Boolean(searchParams.get("busca"));
  const items = useCart((s) => s.items);
  const restaurantSlug = useCart((s) => s.restaurantSlug);
  const mounted = useMounted();
  const navVariants = useNenosVariants(bottomNavMotion);

  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  const cartHref = restaurantSlug ? `/${restaurantSlug}/cart` : "/cart";

  function isActive(label: string) {
    if (label === "Início") return pathname === "/" && !hasSearch;
    if (label === "Busca") return pathname === "/" && hasSearch;
    if (label === "Feed") return pathname.startsWith("/feed");
    if (label === "Conta") return pathname.startsWith("/account");
    return false;
  }

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="relative border-t border-orange-100 bg-white/95 px-2 safe-bottom backdrop-blur-xl">
        <MotionLink
          key={count > 0 ? `cart-${count}` : "cart"}
          href={cartHref}
          initial="idle"
          animate="bounce"
          variants={cartFabMotion}
          className="absolute -top-7 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-nenos-gradient text-white shadow-orange-lg ring-4 ring-[#FFF9F2]"
          aria-label="Carrinho"
        >
          <ShoppingBag className="h-7 w-7" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-[#1C1917]">
              {count}
            </span>
          )}
        </MotionLink>

        <div className="flex items-stretch pt-3">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(label);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 pb-3 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[10px] font-semibold", active && "text-primary")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
