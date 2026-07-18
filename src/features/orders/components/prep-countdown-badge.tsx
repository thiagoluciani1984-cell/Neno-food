"use client";

import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNow } from "../hooks/use-now";
import { getEstimatedReadyAtMs, formatPrepCountdown, type PrepTimeOrder } from "../prep-time";

export function PrepCountdownBadge({
  order,
  className,
}: {
  order: PrepTimeOrder;
  className?: string;
}) {
  const now = useNow();
  const estimatedReadyAtMs = getEstimatedReadyAtMs(order);
  const { label, isLate } = formatPrepCountdown(estimatedReadyAtMs, now);

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isLate ? "text-destructive" : "text-muted-foreground",
        className
      )}
    >
      {isLate ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}
