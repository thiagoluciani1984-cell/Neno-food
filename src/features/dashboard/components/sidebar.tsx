"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const NAV = [
  { href: "/dashboard",          label: "Visão geral",    icon: LayoutDashboard },
  { href: "/dashboard/orders",   label: "Pedidos",         icon: ClipboardList },
  { href: "/dashboard/menu",     label: "Cardápio",        icon: UtensilsCrossed },
  { href: "/dashboard/studio",   label: "Nenos Studio",    icon: Camera },
  { href: "/dashboard/social",   label: "Publicações",     icon: Rss },
  { href: "/dashboard/profile",  label: "Meu perfil",      icon: Store },
  { href: "/dashboard/staff",    label: "Equipe",          icon: UserCog },
  { href: "/dashboard/customers",label: "Clientes",        icon: Users },
  { href: "/dashboard/coupons",  label: "Cupons",          icon: Ticket },
  { href: "/dashboard/delivery", label: "Entregas",        icon: Bike },
  { href: "/dashboard/reports",  label: "Relatórios",      icon: BarChart3 },
  { href: "/dashboard/settings", label: "Configurações",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
