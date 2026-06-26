import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  subtitle = true,
}: {
  className?: string;
  href?: string;
  subtitle?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      {/* Ícone da marca — círculo vermelho com mascote */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
        <span className="text-xl leading-none select-none">🍔</span>
        {/* Traços de velocidade (delivery) */}
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
          <span className="block h-[2px] w-2 rounded-full bg-primary opacity-70" />
          <span className="block h-[2px] w-3 rounded-full bg-primary opacity-50" />
          <span className="block h-[2px] w-1.5 rounded-full bg-primary opacity-30" />
        </span>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-primary">
          nenos
        </span>
        {subtitle && (
          <span className="text-sm font-bold tracking-wide" style={{ color: "#FFB300" }}>
            food
          </span>
        )}
      </div>
    </Link>
  );
}
