import type { LucideIcon } from "lucide-react";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageSearch,
  emoji,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  const sizes = {
    sm: { wrapper: "py-10",    icon: "h-10 w-10", emoji: "text-3xl", title: "text-base", desc: "text-xs" },
    md: { wrapper: "py-16",    icon: "h-14 w-14", emoji: "text-4xl", title: "text-lg",   desc: "text-sm" },
    lg: { wrapper: "py-24",    icon: "h-20 w-20", emoji: "text-5xl", title: "text-xl",   desc: "text-base" },
  };
  const s = sizes[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        s.wrapper,
        className
      )}
    >
      {/* Ícone ou emoji */}
      {emoji ? (
        <span className={cn(s.emoji, "leading-none select-none")}>{emoji}</span>
      ) : (
        <div className="flex items-center justify-center rounded-2xl bg-muted p-4">
          <Icon className={cn(s.icon, "text-muted-foreground/50")} />
        </div>
      )}

      {/* Texto */}
      <div className="space-y-1.5 max-w-xs">
        <p className={cn("font-semibold text-foreground", s.title)}>{title}</p>
        {description && (
          <p className={cn("text-muted-foreground", s.desc)}>{description}</p>
        )}
      </div>

      {/* Ações */}
      {(action || secondaryAction) && (
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          {action && (
            <Button
              variant={action.variant ?? "default"}
              onClick={action.onClick}
              size="sm"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
