import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold text-foreground">{title}</h2>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
            >
              {action.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
            >
              {action.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
