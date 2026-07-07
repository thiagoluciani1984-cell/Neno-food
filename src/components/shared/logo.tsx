import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/logo.png";

export function Logo({
  className,
  href = "/",
  subtitle = false,
  size = "md",
}: {
  className?: string;
  href?: string;
  subtitle?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const heights = { sm: 32, md: 40, lg: 52 } as const;
  const h = heights[size];

  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <Image
        src={LOGO_SRC}
        alt="Nenos Food"
        width={Math.round(h * 2.8)}
        height={h}
        className="h-auto w-auto object-contain"
        style={{ height: h, width: "auto" }}
        priority
      />
      {subtitle && (
        <span className="ml-2 hidden text-xs font-semibold text-muted-foreground sm:inline">
          Delivery
        </span>
      )}
    </Link>
  );
}
