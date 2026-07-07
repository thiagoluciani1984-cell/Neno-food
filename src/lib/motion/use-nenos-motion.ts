"use client";

import { useReducedMotion } from "framer-motion";
import { reducedFadeVariants } from "@/lib/motion/nenos-motion";
import type { Variants } from "framer-motion";

export function useNenosReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

/** Retorna variants completos ou fade instantâneo para acessibilidade */
export function useNenosVariants<T extends Variants>(variants: T): T | typeof reducedFadeVariants {
  const reduced = useNenosReducedMotion();
  return reduced ? reducedFadeVariants : variants;
}
