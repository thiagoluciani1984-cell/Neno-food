"use client";

import { motion } from "framer-motion";
import { cardItem, nenosClass } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import { cn } from "@/lib/utils";

export function RestaurantHeroCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const variants = useNenosVariants(cardItem);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className={cn(nenosClass.card, "p-5 shadow-xl shadow-orange-500/10 sm:p-6", className)}
    >
      {children}
    </motion.div>
  );
}
