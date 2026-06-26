"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export function QuantitySelector({
  value,
  min = 0,
  max = 99,
  onChange,
  size = "md",
  className,
  disabled = false,
}: QuantitySelectorProps) {
  const sizes = {
    sm: { btn: "h-7 w-7 text-xs",  value: "w-6 text-sm",  icon: "h-3 w-3" },
    md: { btn: "h-9 w-9 text-sm",  value: "w-8 text-base", icon: "h-4 w-4" },
    lg: { btn: "h-11 w-11 text-base", value: "w-10 text-lg", icon: "h-5 w-5" },
  };
  const s = sizes[size];

  function decrement() {
    if (value > min) onChange(value - 1);
  }
  function increment() {
    if (value < max) onChange(value + 1);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border bg-white shadow-sm",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <button
        type="button"
        aria-label="Diminuir quantidade"
        onClick={decrement}
        disabled={disabled || value <= min}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors",
          "hover:bg-primary/5 active:bg-primary/10 disabled:opacity-30",
          s.btn
        )}
      >
        <Minus className={s.icon} />
      </button>

      <span
        className={cn(
          "text-center font-bold tabular-nums select-none",
          s.value
        )}
        aria-live="polite"
        aria-label={`Quantidade: ${value}`}
      >
        {value}
      </span>

      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={increment}
        disabled={disabled || value >= max}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors",
          "bg-primary text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-30",
          s.btn
        )}
      >
        <Plus className={s.icon} />
      </button>
    </div>
  );
}
