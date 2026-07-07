"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutGroup, motion } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Users,
  Ticket,
  Bike,
  BarChart3,
  Settings,
  Store,
  UserCog,
  Camera,
  Rss,
} from "lucide-react";
import { springSoft } from "@/lib/motion/nenos-motion";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/dashboard/menu", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/dashboard/studio", label: "Nenos Studio", icon: Camera },
  { href: "/dashboard/social", label: "Publicações", icon: Rss },
  { href: "/dashboard/profile", label: "Meu perfil", icon: Store },
  { href: "/dashboard/staff", label: "Equipe", icon: UserCog },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/coupons", label: "Cupons", icon: Ticket },
  { href: "/dashboard/delivery", label: "Entregas", icon: Bike },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-orange-100 bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-orange-50 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/brand/logo.png" alt="Nenos Food" width={120} height={36} className="h-8 w-auto" />
        </Link>
      </div>

      <LayoutGroup>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",
                  !isActive &&
                    "text-muted-foreground hover:bg-orange-50 hover:text-primary hover-nenos-soft"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-pill"
                    className="absolute inset-0 rounded-2xl bg-primary shadow-orange"
                    transition={springSoft}
                  />
                )}
                <Icon className={cn("relative z-10 h-5 w-5", isActive && "text-white")} />
                <span className={cn("relative z-10", isActive && "text-white")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="m-3 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <p className="text-sm font-extrabold text-primary">Cresça com Nenos Food</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Gerencie pedidos e aumente suas vendas online.
        </p>
      </div>
    </aside>
  );
}
