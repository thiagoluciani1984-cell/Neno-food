import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function VerifiedBadge({
  label = "Nenos Verificado",
  size = "md",
  className,
  showIcon = true,
}: VerifiedBadgeProps) {
  const sizes = {
    sm: { wrapper: "gap-1 px-2 py-0.5 text-[10px]", icon: "h-3 w-3" },
    md: { wrapper: "gap-1.5 px-2.5 py-1 text-xs",   icon: "h-3.5 w-3.5" },
    lg: { wrapper: "gap-2 px-3 py-1.5 text-sm",      icon: "h-4 w-4" },
  };
  const s = sizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        "bg-primary/10 text-primary ring-1 ring-primary/20",
        s.wrapper,
        className
      )}
    >
      {showIcon && <ShieldCheck className={cn("shrink-0", s.icon)} />}
      {label}
    </span>
  );
}

/* Badge compacto apenas com ícone (para usar sobre avatares) */
export function VerifiedIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-sm",
        className
      )}
      title="Nenos Verificado"
      aria-label="Nenos Verificado"
    >
      <ShieldCheck className="h-3 w-3 text-white" />
    </span>
  );
}
