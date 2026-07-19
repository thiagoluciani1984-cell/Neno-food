import Image from "next/image";
import { ArrowRight } from "lucide-react";

export type PromoSlide = {
  eyebrow: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
};

export const marketplacePromos: PromoSlide[] = [
  {
    eyebrow: "Nenos seleciona",
    badge: "20% OFF",
    title: "Com fome? Peça agora!",
    subtitle: "20% de desconto no seu primeiro pedido online.",
    cta: "Pedir agora",
  },
  {
    eyebrow: "Mais perto de você",
    badge: "Frete grátis",
    title: "Entrega inteligente",
    subtitle: "Restaurantes com frete competitivo perto de você.",
    cta: "Ver ofertas",
  },
];

export function PromoBanner({ promo }: { promo: PromoSlide }) {
  return (
    <div className="relative isolate min-h-[240px] overflow-hidden bg-[#171717] sm:min-h-[320px] lg:min-h-[380px]">
      <Image
        src="/brand/mascot/hero-banner.webp"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1100px"
        className="object-cover object-[78%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="relative z-10 flex h-full max-w-[68%] flex-col justify-center p-5 text-white sm:max-w-md sm:p-10 lg:max-w-lg">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 sm:text-xs">
          {promo.eyebrow}
        </span>
        <span className="mt-2 inline-flex w-fit rounded-full bg-primary/90 px-3 py-1 text-xs font-bold backdrop-blur-sm">
          {promo.badge}
        </span>
        <h2 className="mt-4 text-2xl font-extrabold leading-[1.05] tracking-tight drop-shadow-sm sm:text-4xl lg:text-5xl">
          {promo.title}
        </h2>
        <p className="mt-3 text-sm text-white/85 drop-shadow-sm sm:text-base">{promo.subtitle}</p>
        <button
          type="button"
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-md transition-transform hover:scale-105"
        >
          {promo.cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PromoBannerDots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mt-4 flex justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`h-1.5 rounded-full transition-all ${
            i === active ? "w-6 bg-primary" : "w-1.5 bg-primary/30"
          }`}
          aria-label={`Slide ${i + 1}`}
        />
      ))}
    </div>
  );
}
