"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Home, ReceiptText, User, ShoppingBag } from "lucide-react";
import { cartFabMotion, bottomNavMotion } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { useCart } from "@/features/cart/use-cart";

const MotionLink = motion.create(Link);

const NAV = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/?busca=1", icon: Compass, label: "Explorar" },
  { href: "/account", icon: ReceiptText, label: "Pedidos" },
  { href: "/account?aba=enderecos", icon: User, label: "Perfil" },
] as const;

export function StoreBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasSearch = Boolean(searchParams.get("busca"));
  const accountTab = searchParams.get("aba");
  const items = useCart((s) => s.items);
  const restaurantSlug = useCart((s) => s.restaurantSlug);
  const mounted = useMounted();
  const navVariants = useNenosVariants(bottomNavMotion);

  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  const cartHref = restaurantSlug ? `/${restaurantSlug}/cart` : "/cart";

  function isActive(label: string) {
    if (label === "Início") return pathname === "/" && !hasSearch;
    if (label === "Explorar") return pathname === "/" && hasSearch;
    if (label === "Pedidos") return pathname.startsWith("/account") && (!accountTab || accountTab === "pedidos");
    if (label === "Perfil") return pathname.startsWith("/account") && Boolean(accountTab && accountTab !== "pedidos");
    return false;
  }

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="relative mx-2 mb-2 rounded-[28px] border border-orange-100/70 bg-white/95 px-2 safe-bottom shadow-[0_18px_55px_-20px_rgba(66,34,14,0.4)] backdrop-blur-xl">
        <MotionLink
          key={count > 0 ? `cart-${count}` : "cart"}
          href={cartHref}
          initial="idle"
          animate="bounce"
          variants={cartFabMotion}
          className="absolute -top-7 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-nenos-gradient text-white shadow-orange-lg ring-[6px] ring-[#fffaf4]"
          aria-label="Carrinho"
        >
          <ShoppingBag className="h-7 w-7" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-[#1C1917]">
              {count}
            </span>
          )}
        </MotionLink>

        <div className="grid grid-cols-5 items-stretch pt-3">
          {NAV.slice(0, 2).map(({ href, icon: Icon, label }) => {
            const active = isActive(label);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 pb-3 transition-colors",
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
          <span aria-hidden="true" />
          {NAV.slice(2).map(({ href, icon: Icon, label }) => {
            const active = isActive(label);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 pb-3 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[10px] font-semibold", active && "text-primary")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
