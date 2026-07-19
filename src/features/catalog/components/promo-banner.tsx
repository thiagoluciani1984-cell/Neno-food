import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export type PromoSlide = {
  eyebrow: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: string;
};

export const marketplacePromos: PromoSlide[] = [
  {
    eyebrow: "Boas-vindas Nenos",
    badge: "20% OFF",
    title: "Bateu aquela",
    highlight: "fome deliciosa?",
    subtitle: "Ganhe 20% de desconto no seu primeiro pedido.",
    cta: "Pedir agora",
  },
  {
    eyebrow: "Seu momento favorito",
    badge: "Entrega rápida",
    title: "Do restaurante",
    highlight: "direto para você",
    subtitle: "Escolha seu sabor e acompanhe tudo pelo app.",
    cta: "Explorar sabores",
  },
];

export function PromoBanner({ promo }: { promo: PromoSlide }) {
  return (
    <div className="relative isolate min-h-[255px] overflow-hidden bg-gradient-to-br from-[#ff5a00] via-[#ff7900] to-[#ffb000] sm:min-h-[330px] lg:min-h-[370px]">
      <div className="absolute -left-20 -top-28 h-72 w-72 rounded-full border-[44px] border-white/10" />
      <div className="absolute bottom-[-7rem] right-[28%] h-64 w-64 rounded-full bg-yellow-200/25 blur-2xl" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative z-20 flex min-h-[255px] max-w-[58%] flex-col justify-center p-5 text-white sm:min-h-[330px] sm:max-w-[52%] sm:p-10 lg:min-h-[370px] lg:p-14">
        <span className="inline-flex w-fit items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/75 sm:text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          {promo.eyebrow}
        </span>
        <h2 className="mt-3 text-[26px] font-black leading-[0.98] tracking-[-0.045em] drop-shadow-sm sm:mt-5 sm:text-5xl lg:text-[3.5rem]">
          {promo.title}
          <span className="mt-1 block text-[#ffe06b]">{promo.highlight}</span>
        </h2>
        <p className="mt-3 max-w-sm text-xs font-semibold leading-relaxed text-white/90 sm:mt-5 sm:text-base lg:text-lg">
          {promo.subtitle}
        </p>
        <Link
          href="#todos-restaurantes"
          className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-primary shadow-[0_14px_35px_-14px_rgba(73,31,0,0.55)] transition-transform hover:scale-105 sm:mt-7 sm:px-6 sm:py-3 sm:text-sm"
        >
          {promo.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="pointer-events-none absolute -bottom-5 -right-12 z-10 h-[245px] w-[245px] sm:-bottom-10 sm:right-1 sm:h-[360px] sm:w-[360px] lg:right-12 lg:h-[410px] lg:w-[410px]">
        <span className="absolute inset-[8%] rounded-full border-4 border-white/80 bg-white/15 shadow-[0_0_0_12px_rgba(255,255,255,0.12)] backdrop-blur-[1px]" />
        <Image
          src="/brand/mascot/home-hero.png"
          alt="Mascote Nenos Food com uma fatia de pizza"
          fill
          priority
          sizes="(max-width: 640px) 245px, 410px"
          className="animate-nenos-soft-float object-contain object-bottom drop-shadow-[0_22px_24px_rgba(104,39,0,0.22)]"
        />
      </div>

      <div className="absolute right-[38%] top-[28%] z-30 hidden rotate-[-9deg] rounded-full bg-white px-4 py-3 text-center text-sm font-black leading-none text-primary shadow-xl sm:block lg:right-[40%]">
        {promo.badge.split(" ").map((word) => (
          <span key={word} className="block">{word}</span>
        ))}
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
    <div className="mt-4 flex justify-center gap-2">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          className={`h-2 rounded-full transition-all duration-300 ${
            index === active ? "w-8 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/45"
          }`}
          aria-label={`Mostrar oferta ${index + 1}`}
        />
      ))}
    </div>
  );
}
