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
    <div className="relative overflow-hidden p-5 text-white sm:p-6">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 right-4 hidden opacity-90 sm:block">
        <Image src="/brand/logo.png" alt="" width={100} height={36} className="opacity-30" />
      </div>
      <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
        {promo.badge}
      </span>
      <h2 className="mt-3 max-w-xs text-xl font-extrabold leading-tight sm:text-2xl">
        {promo.title}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-white/85">{promo.subtitle}</p>
      <button
        type="button"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-sm"
      >
        {promo.cta}
        <ArrowRight className="h-4 w-4" />
      </button>
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
