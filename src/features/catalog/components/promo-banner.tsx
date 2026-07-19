import Image from "next/image";
import { ArrowRight } from "lucide-react";

export type PromoSlide = {
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
};

export const marketplacePromos: PromoSlide[] = [
  {
    badge: "20% OFF",
    title: "Com fome? Peça agora!",
    subtitle: "20% de desconto no seu primeiro pedido online.",
    cta: "Pedir agora",
  },
  {
    badge: "Frete grátis",
    title: "Entrega inteligente",
    subtitle: "Restaurantes com frete competitivo perto de você.",
    cta: "Ver ofertas",
  },
];

export function PromoBanner({ promo }: { promo: PromoSlide }) {
  return (
    <div className="relative isolate min-h-[220px] overflow-hidden sm:min-h-[280px]">
      <Image
        src="/brand/mascot/hero-banner.webp"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 900px"
        className="object-cover object-[78%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-black/0 to-transparent" />
      <div className="relative z-10 max-w-[62%] p-5 text-white sm:max-w-sm sm:p-8">
        <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
          {promo.badge}
        </span>
        <h2 className="mt-3 text-xl font-extrabold leading-tight drop-shadow-sm sm:text-3xl">
          {promo.title}
        </h2>
        <p className="mt-2 text-sm text-white/90 drop-shadow-sm sm:text-base">{promo.subtitle}</p>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-md transition-transform hover:scale-105"
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
