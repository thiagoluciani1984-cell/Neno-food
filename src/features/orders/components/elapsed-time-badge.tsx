"use client";

import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNow } from "../hooks/use-now";
import { formatElapsed } from "../prep-time";

export function ElapsedTimeBadge({
  createdAt,
  className,
}: {
  createdAt: string;
  className?: string;
}) {
  const now = useNow();

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <Timer className="h-3 w-3" />
      {formatElapsed(createdAt, now)}
    </span>
  );
}
