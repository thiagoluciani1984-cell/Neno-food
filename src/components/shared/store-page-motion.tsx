"use client";

import { motion } from "framer-motion";
import { fadeInMotion } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";

export function StorePageMotion({ children }: { children: React.ReactNode }) {
  const variants = useNenosVariants(fadeInMotion);

  return (
    <motion.div variants={variants} initial="initial" animate="animate">
      {children}
    </motion.div>
  );
}
