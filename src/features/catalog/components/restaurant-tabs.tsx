"use client";

import Link from "next/link";
import { LayoutGroup, motion } from "framer-motion";
import { Images, Star } from "lucide-react";
import { tabIndicatorMotion } from "@/lib/motion/nenos-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "cardapio", label: "Cardápio", icon: null },
  { id: "publicacoes", label: "Publicações", icon: Images },
  { id: "avaliacoes", label: "Avaliações", icon: Star },
] as const;

export function RestaurantTabs({
  slug,
  active,
  reviewsCount = 0,
}: {
  slug: string;
  active: "cardapio" | "publicacoes" | "avaliacoes";
  reviewsCount?: number;
}) {
  const href = (tab: string) => (tab === "cardapio" ? `/${slug}` : `/${slug}?aba=${tab}`);

  return (
    <div className="sticky top-16 z-30 border-b border-orange-100 bg-white/95 backdrop-blur">
      <LayoutGroup>
        <div className="container relative flex gap-0">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={href(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="restaurant-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                    transition={tabIndicatorMotion}
                  />
                )}
                {Icon && <Icon className="relative z-10 h-4 w-4" />}
                <span className="relative z-10">
                  {tab.label}
                  {tab.id === "avaliacoes" && reviewsCount > 0 && (
                    <span className="ml-0.5 text-xs text-muted-foreground">({reviewsCount})</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
