import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";

interface PriceDisplayProps {
  priceCents: number;
  promoPriceCents?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFrom?: boolean;
}

const SIZE_MAP = {
  sm: { promo: "text-sm font-bold",  original: "text-xs", from: "text-xs" },
  md: { promo: "text-base font-bold", original: "text-sm", from: "text-xs" },
  lg: { promo: "text-xl font-bold",  original: "text-sm", from: "text-xs" },
  xl: { promo: "text-2xl font-bold", original: "text-base", from: "text-sm" },
};

export function PriceDisplay({
  priceCents,
  promoPriceCents,
  size = "md",
  className,
  showFrom = false,
}: PriceDisplayProps) {
  const s = SIZE_MAP[size];
  const hasPromo = promoPriceCents != null && promoPriceCents < priceCents;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      {/* Preço de exibição (promo ou normal) */}
      <span className={cn(s.promo, hasPromo ? "text-primary" : "text-foreground")}>
        {showFrom && <span className={cn("mr-1 font-normal", s.from)}>a partir de</span>}
        {formatBRL(hasPromo ? promoPriceCents! : priceCents)}
      </span>

      {/* Preço original riscado */}
      {hasPromo && (
        <span className={cn("line-through text-muted-foreground", s.original)}>
          {formatBRL(priceCents)}
        </span>
      )}
    </div>
  );
}

/* Badge de desconto percentual */
export function DiscountBadge({
  priceCents,
  promoPriceCents,
  className,
}: {
  priceCents: number;
  promoPriceCents: number;
  className?: string;
}) {
  if (promoPriceCents >= priceCents) return null;
  const pct = Math.round(((priceCents - promoPriceCents) / priceCents) * 100);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white",
        className
      )}
    >
      -{pct}%
    </span>
  );
}
