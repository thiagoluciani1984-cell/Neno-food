"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { addButtonMotion } from "@/lib/motion/nenos-motion";
import { cn } from "@/lib/utils";

type ProductAddButtonProps = {
  wasAdded?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function ProductAddButton({
  wasAdded = false,
  onClick,
  disabled,
  className,
  "aria-label": ariaLabel = "Adicionar",
}: ProductAddButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      animate={wasAdded ? "added" : "idle"}
      variants={addButtonMotion}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-orange disabled:opacity-50",
        className
      )}
      aria-label={ariaLabel}
    >
      <Plus className="h-5 w-5" />
    </motion.button>
  );
}
