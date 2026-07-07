"use client";

import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cardItem } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";

type OrderActiveBannerProps = {
  orderNumber: string;
  restaurantName: string;
  statusLabel: string;
};

export function OrderActiveBanner({
  orderNumber,
  restaurantName,
  statusLabel,
}: OrderActiveBannerProps) {
  const variants = useNenosVariants(cardItem);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className="flex items-center justify-between gap-4 rounded-3xl nenos-gradient p-4 text-white shadow-lg shadow-primary/25"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white/80">Pedido ativo</p>
          <p className="font-extrabold">#{orderNumber}</p>
          <p className="text-xs text-white/75">{restaurantName}</p>
        </div>
      </div>
      <Badge className="rounded-full border-0 bg-white/20 text-white backdrop-blur-sm">
        {statusLabel}
      </Badge>
    </motion.div>
  );
}
