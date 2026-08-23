import Image from "next/image";
import { mascotMotion } from "@/lib/motion/nenos-motion";
import { cn } from "@/lib/utils";

export type MascotPose = "home" | "chef" | "delivery" | "empty" | "banner";
export type MascotMotion = keyof typeof mascotMotion;

const poses = {
  home: { src: "/brand/mascot/home-hero.png", width: 600, height: 640 },
  chef: { src: "/brand/mascot/chef.webp", width: 900, height: 491 },
  delivery: { src: "/brand/mascot/motoboy.webp", width: 700, height: 420 },
  empty: { src: "/brand/mascot/empty-state.webp", width: 480, height: 434 },
  banner: { src: "/brand/mascot/hero-banner.webp", width: 1600, height: 893 },
} as const;

const sizeClass = {
  sm: "w-24",
  md: "w-40",
  lg: "w-64",
  hero: "w-full max-w-md",
} as const;

interface BrandMascotProps {
  pose: MascotPose;
  motion?: MascotMotion;
  size?: keyof typeof sizeClass;
  alt?: string;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}

/**
 * Personagem recorrente da plataforma.
 *
 * Contextos: home = descoberta; chef = preparo; delivery = rota;
 * empty = ausência/erro; banner = campanhas. Motion é sempre CSS e respeita
 * `prefers-reduced-motion` pelo sistema global Nenos.
 */
export function BrandMascot({
  pose,
  motion = "float",
  size = "md",
  alt = "Mascote do Nenos Food",
  decorative = false,
  priority = false,
  className,
  imageClassName,
}: BrandMascotProps) {
  const asset = poses[pose];

  return (
    <div
      className={cn("relative shrink-0 select-none", sizeClass[size], mascotMotion[motion], className)}
      aria-hidden={decorative || undefined}
    >
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt={decorative ? "" : alt}
        priority={priority}
        sizes={size === "hero" ? "(max-width: 768px) 82vw, 448px" : undefined}
        className={cn("h-auto w-full object-contain drop-shadow-[0_18px_28px_rgba(91,45,12,0.16)]", imageClassName)}
      />
    </div>
  );
}
