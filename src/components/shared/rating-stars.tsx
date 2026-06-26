"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number;           // 0–5 (suporta decimais na exibição)
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const SIZE_MAP = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function RatingStars({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false,
  reviewCount,
  className,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;
  const iconClass = SIZE_MAP[size];

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {/* Estrelas */}
      <span className="flex items-center">
        {Array.from({ length: max }, (_, i) => {
          const filled = display >= i + 1;
          const half = !filled && display >= i + 0.5;

          return (
            <button
              key={i}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              aria-label={`${i + 1} estrela${i + 1 > 1 ? "s" : ""}`}
              onClick={() => interactive && onChange?.(i + 1)}
              onMouseEnter={() => interactive && setHovered(i + 1)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={cn(
                "relative",
                interactive
                  ? "cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none"
                  : "cursor-default"
              )}
            >
              {/* Estrela vazia (fundo) */}
              <Star className={cn(iconClass, "text-muted-foreground/30")} />

              {/* Estrela preenchida (sobreposição) */}
              {(filled || half) && (
                <span
                  className={cn(
                    "absolute inset-0 overflow-hidden",
                    half ? "w-1/2" : "w-full"
                  )}
                >
                  <Star
                    className={cn(iconClass, "fill-[#FFB300] text-[#FFB300]")}
                  />
                </span>
              )}
            </button>
          );
        })}
      </span>

      {/* Valor numérico */}
      {showValue && (
        <span className="text-sm font-bold text-foreground">
          {value.toFixed(1)}
        </span>
      )}

      {/* Contagem de avaliações */}
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({reviewCount.toLocaleString("pt-BR")})
        </span>
      )}
    </span>
  );
}
