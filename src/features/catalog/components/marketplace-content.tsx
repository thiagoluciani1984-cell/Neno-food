"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bike,
  ChevronRight,
  Clock,
  Heart,
  Plus,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import {
  cardItem,
  homepageOrchestrator,
  homepageSection,
  mobileCardItem,
  nenosEase,
  promoBannerMotion,
  slideUpMotion,
  staggerContainer,
} from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import { formatBRL } from "@/lib/money";
import { resolveMenuImage } from "@/lib/menu-image-overrides";
import { MarketplaceSearchBar } from "@/features/catalog/components/store-header";
import {
  marketplacePromos,
  PromoBanner,
  PromoBannerDots,
} from "@/features/catalog/components/promo-banner";
import type {
  MarketplaceProductHit,
  RestaurantCard,
} from "@/features/catalog/queries-marketplace";

const CATEGORIES = [
  {
    label: "Todos",
    filter: null,
    image: "/menu/point-da-pizza/pizza-mucarela-base.webp",
  },
  {
    label: "Pizzas",
    filter: "pizza",
    image: "/menu/point-da-pizza/pizza-pepperoni-base.webp",
  },
  {
    label: "Massas",
    filter: "italiana",
    image: "/menu/lucianis/lasanha-5-queijos.webp",
  },
  {
    label: "Combos",
    filter: null,
    image: "/menu/point-da-pizza/combo-familia-master.webp",
  },
  {
    label: "Bebidas",
    filter: null,
    image: "/menu/shared/cola.webp",
  },
  {
    label: "Doces",
    filter: null,
    image: "/menu/point-da-pizza/brigadeiro-doce.webp",
  },
] as const;

const QUICK_FILTERS = ["Aberto agora", "Entrega grátis", "Mais pedidos"] as const;
type QuickFilter = (typeof QUICK_FILTERS)[number];

export function MarketplaceContent({
  restaurants,
  initialQuery = "",
  initialProductHits = [],
  featuredProducts = [],
}: {
  restaurants: RestaurantCard[];
  initialQuery?: string;
  initialProductHits?: MarketplaceProductHit[];
  featuredProducts?: MarketplaceProductHit[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === initialQuery.trim()) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (trimmed.length >= 2) params.set("busca", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query, initialQuery, router]);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(
      () => setActiveSlide((slide) => (slide + 1) % marketplacePromos.length),
      5600
    );
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const category = CATEGORIES.find((item) => item.label === activeCategory);
    const categoryFilter = category?.filter;

    let list = restaurants.filter(({ restaurant, settings }) => {
      const cuisine = restaurant.cuisine ?? "";
      const searchable = `${restaurant.name} ${cuisine}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesCategory = !categoryFilter || searchable.includes(categoryFilter);
      const matchesQuickFilter =
        !activeQuickFilter ||
        (activeQuickFilter === "Aberto agora" && settings?.is_open === true) ||
        (activeQuickFilter === "Entrega grátis" && (settings?.delivery_fee_cents ?? 0) === 0) ||
        activeQuickFilter === "Mais pedidos";

      return matchesQuery && matchesCategory && matchesQuickFilter;
    });

    if (activeQuickFilter === "Mais pedidos") {
      list = [...list].sort(
        (a, b) => (b.restaurant.total_orders ?? 0) - (a.restaurant.total_orders ?? 0)
      );
    }

    return list;
  }, [restaurants, query, activeCategory, activeQuickFilter]);

  const searchVariants = useNenosVariants(slideUpMotion);
  const sectionVariants = useNenosVariants(homepageSection);
  const orchestratorVariants = useNenosVariants(homepageOrchestrator);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffaf4] pb-5">
      <div className="pointer-events-none absolute -left-40 top-24 h-80 w-80 rounded-full bg-orange-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-44 top-[34rem] h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />

      <motion.div
        variants={orchestratorVariants}
        initial="initial"
        animate="animate"
        className="container relative z-10 max-w-[1240px] space-y-8 py-4 sm:space-y-10 sm:py-8 lg:py-10"
      >
        <motion.section variants={searchVariants} className="mx-auto w-full max-w-4xl">
          <MarketplaceSearchBar
            value={query}
            onChange={setQuery}
            onFilterClick={() => setFiltersOpen((open) => !open)}
            filtersOpen={filtersOpen}
          />

          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.28, ease: nenosEase }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-wrap gap-2 rounded-[22px] border border-orange-100 bg-white p-3 shadow-[0_18px_50px_-32px_rgba(234,88,12,0.45)]">
                  {QUICK_FILTERS.map((item) => {
                    const active = activeQuickFilter === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setActiveQuickFilter(active ? null : item)}
                        className={`rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
                          active
                            ? "bg-primary text-white shadow-md shadow-primary/25"
                            : "bg-orange-50 text-[#7c4a2d] hover:bg-orange-100"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section variants={sectionVariants}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              variants={promoBannerMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden rounded-[30px] shadow-[0_28px_70px_-30px_rgba(234,88,12,0.65)] sm:rounded-[38px]"
            >
              <PromoBanner promo={marketplacePromos[activeSlide]} />
            </motion.div>
          </AnimatePresence>
          <PromoBannerDots
            count={marketplacePromos.length}
            active={activeSlide}
            onSelect={setActiveSlide}
          />
        </motion.section>

        <motion.section variants={sectionVariants}>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:justify-center">
            {CATEGORIES.map((category, index) => {
              const active = activeCategory === category.label;
              return (
                <motion.button
                  key={category.label}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.045, ease: nenosEase }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveCategory(category.label)}
                  className="group flex w-[78px] shrink-0 flex-col items-center gap-2.5 outline-none sm:w-[104px]"
                >
                  <span
                    className={`relative flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-[24px] border-2 transition-all sm:h-20 sm:w-20 ${
                      active
                        ? "border-primary bg-primary shadow-[0_16px_30px_-12px_rgba(249,115,22,0.7)]"
                        : "border-white bg-white shadow-[0_14px_30px_-20px_rgba(41,24,13,0.35)] group-hover:-translate-y-1 group-hover:border-orange-200"
                    }`}
                  >
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      sizes="80px"
                      className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
                        active ? "scale-105" : ""
                      }`}
                    />
                    {active && <span className="absolute inset-0 ring-2 ring-inset ring-white/35" />}
                  </span>
                  <span className={`text-xs font-extrabold ${active ? "text-primary" : "text-[#4a4039]"}`}>
                    {category.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {initialQuery.length >= 2 && (
          <motion.div variants={sectionVariants}>
            <SearchResults query={initialQuery} hits={initialProductHits} />
          </motion.div>
        )}

        {!initialQuery && filtered.length > 0 && (
          <motion.section variants={sectionVariants}>
            <SectionHeading
              eyebrow="Mais queridos"
              title="Restaurantes populares"
              action={<SectionLink href="#todos-restaurantes" label="Ver todos" />}
            />
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex snap-x gap-4 overflow-x-auto pb-4 scrollbar-hide sm:gap-5"
            >
              {filtered.map((card) => (
                <motion.div
                  key={card.restaurant.id}
                  variants={mobileCardItem}
                  className="shrink-0 snap-start"
                >
                  <PopularRestaurantCard {...card} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {!initialQuery && featuredProducts.length > 0 && (
          <motion.section variants={sectionVariants}>
            <SectionHeading
              eyebrow="Escolhidos para você"
              title="Destaques do cardápio"
              action={<SectionLink href="#todos-restaurantes" label="Ver todos" />}
            />
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
            >
              {featuredProducts.slice(0, 8).map((hit) => (
                <motion.div key={hit.product.id} variants={mobileCardItem}>
                  <FeaturedProductCard {...hit} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        <motion.section id="todos-restaurantes" variants={sectionVariants} className="scroll-mt-28">
          <SectionHeading
            eyebrow="Perto de você"
            title={activeCategory !== "Todos" || query ? `Resultados (${filtered.length})` : "Todos os restaurantes"}
          />
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: nenosEase }}
              className="rounded-[30px] border border-orange-100 bg-white py-10 text-center shadow-sm"
            >
              <Image
                src="/brand/mascot/empty-state.webp"
                alt=""
                width={480}
                height={434}
                className="mx-auto mb-2 h-36 w-auto"
              />
              <p className="font-bold text-[#403730]">Nenhum restaurante encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground">Tente outro termo ou categoria.</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filtered.map((card) => (
                <motion.div key={card.restaurant.id} variants={cardItem}>
                  <RestaurantGridCard {...card} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/65">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-0.5 text-lg font-black tracking-[-0.025em] text-[#211d1a] sm:text-2xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-0.5 text-xs font-extrabold text-primary hover:underline sm:text-sm">
      {label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function PopularRestaurantCard({ restaurant, settings }: RestaurantCard) {
  const reduceMotion = useReducedMotion() ?? false;
  const isOpen = settings?.is_open ?? false;
  const isPoint = restaurant.slug === "poit-da-pizza";
  const coverUrl = isPoint
    ? "/menu/point-da-pizza/pizza-pepperoni-base.webp"
    : restaurant.cover_url;

  return (
    <Link
      href={`/${restaurant.slug}`}
      className="group block w-[250px] overflow-hidden rounded-[26px] border border-black/[0.04] bg-white shadow-[0_18px_50px_-28px_rgba(40,25,15,0.4)] transition-all hover:-translate-y-1.5 hover:shadow-[0_25px_55px_-26px_rgba(234,88,12,0.3)] sm:w-[285px]"
    >
      <div className="relative h-[155px] overflow-hidden bg-muted sm:h-[175px]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="285px"
          />
        ) : (
          <div className="flex h-full items-center justify-center nenos-gradient-diagonal">
            <UtensilsCrossed className="h-12 w-12 text-white/75" />
          </div>
        )}
        {isPoint && (
          <>
            <span className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/10 to-orange-400/20" />
            <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
              Forno no ponto
            </span>
          </>
        )}
        <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm ${
            isOpen ? "bg-emerald-500 text-white" : "bg-black/65 text-white"
          }`}
        >
          {isOpen ? "Aberto" : "Fechado"}
        </span>
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#665d56] shadow-md backdrop-blur">
          <Heart className="h-[18px] w-[18px]" />
        </span>
        {restaurant.logo_url && (
          <motion.span
            initial={isPoint && !reduceMotion ? { opacity: 0, scale: 0.72, rotate: -8 } : false}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.55, ease: nenosEase }}
            className={`absolute -bottom-0 left-3 h-12 w-12 translate-y-1/3 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lg ${isPoint ? "ring-4 ring-orange-500/15" : ""}`}
          >
            <Image
              src={restaurant.logo_url}
              alt=""
              fill
              className={isPoint ? "object-contain p-0.5" : "object-cover"}
              sizes="48px"
            />
          </motion.span>
        )}
      </div>
      <div className="p-4 pt-6">
        <h3 className="truncate text-[15px] font-black text-[#211d1a] transition-colors group-hover:text-primary sm:text-base">
          {restaurant.name}
        </h3>
        <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
          {restaurant.cuisine ?? "Restaurante"}
        </p>
        <div className="mt-3 flex items-center gap-2.5 border-t border-orange-50 pt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-extrabold text-[#3c342f]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {restaurant.avg_rating > 0 ? restaurant.avg_rating.toFixed(1) : "Novo"}
          </span>
          {settings?.avg_prep_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {settings.avg_prep_minutes} min
            </span>
          )}
          <span className="ml-auto font-bold text-primary">
            {settings?.delivery_fee_cents === 0 ? "Grátis" : settings ? formatBRL(settings.delivery_fee_cents) : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedProductCard({ product, restaurant }: MarketplaceProductHit) {
  const price = product.promo_price_cents ?? product.price_cents;
  const imageUrl = resolveMenuImage(product.slug, product.image_url);

  return (
    <Link
      href={`/${restaurant.slug}?produto=${product.slug}`}
      className="group block h-full overflow-hidden rounded-[24px] border border-black/[0.045] bg-white shadow-[0_16px_40px_-25px_rgba(38,24,14,0.38)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_48px_-24px_rgba(234,88,12,0.28)]"
    >
      <div className="relative aspect-[1.16/1] overflow-hidden bg-orange-50 sm:aspect-[1.45/1]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-9 w-9 text-primary/30" />
          </div>
        )}
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-md">
          <Heart className="h-4 w-4" />
        </span>
      </div>
      <div className="flex min-h-[118px] flex-col p-3 sm:min-h-[132px] sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-xs font-black leading-tight text-[#28221e] sm:text-sm">
            {product.name}
          </h3>
          <span className="hidden items-center gap-0.5 text-[11px] font-bold text-primary sm:flex">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.8
          </span>
        </div>
        <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
          {restaurant.name}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <span className="rounded-md bg-amber-100 px-2 py-1 text-[9px] font-extrabold text-amber-700 sm:text-[10px]">
              Popular
            </span>
            <p className="mt-2 text-xs font-black text-primary sm:text-sm">{formatBRL(price)}</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25 transition-transform group-hover:rotate-90 sm:h-10 sm:w-10">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function RestaurantGridCard({ restaurant, settings }: RestaurantCard) {
  const reduceMotion = useReducedMotion() ?? false;
  const isOpen = settings?.is_open ?? false;
  const isPoint = restaurant.slug === "poit-da-pizza";
  const coverUrl = isPoint
    ? "/menu/point-da-pizza/pizza-pepperoni-base.webp"
    : restaurant.cover_url;

  return (
    <Link
      href={`/${restaurant.slug}`}
      className="group block overflow-hidden rounded-[28px] border border-black/[0.045] bg-white shadow-[0_18px_50px_-30px_rgba(38,24,14,0.42)] transition-all hover:-translate-y-1.5 hover:shadow-[0_25px_58px_-28px_rgba(234,88,12,0.3)]"
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center nenos-gradient-diagonal">
            <UtensilsCrossed className="h-12 w-12 text-white/70" />
          </div>
        )}
        {isPoint && (
          <span className="absolute inset-0 bg-gradient-to-tr from-black/65 via-transparent to-orange-400/20" />
        )}
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-extrabold ${isOpen ? "bg-emerald-500 text-white" : "bg-black/65 text-white"}`}>
          {isOpen ? "Aberto" : "Fechado"}
        </span>
        {restaurant.logo_url && (
          <motion.span
            initial={isPoint && !reduceMotion ? { opacity: 0, y: 10, scale: 0.78 } : false}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.5, ease: nenosEase }}
            className="absolute -bottom-0 left-4 h-12 w-12 translate-y-1/3 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-xl"
          >
            <Image
              src={restaurant.logo_url}
              alt=""
              fill
              className={isPoint ? "object-contain p-0.5" : "object-cover"}
              sizes="48px"
            />
          </motion.span>
        )}
      </div>
      <div className={restaurant.logo_url ? "p-4 pt-7" : "p-4"}>
        <h3 className="truncate font-black text-[#211d1a] group-hover:text-primary">{restaurant.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{restaurant.cuisine ?? "Restaurante"}</p>
        <div className="mt-3 flex items-center gap-3 border-t border-orange-50 pt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-extrabold text-[#3c342f]">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {restaurant.avg_rating > 0 ? restaurant.avg_rating.toFixed(1) : "Novo"}
          </span>
          {settings?.avg_prep_minutes && (
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {settings.avg_prep_minutes} min</span>
          )}
          {settings && (
            <span className="ml-auto flex items-center gap-1 font-semibold text-primary">
              <Bike className="h-3.5 w-3.5" />
              {settings.delivery_fee_cents === 0 ? "Grátis" : formatBRL(settings.delivery_fee_cents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SearchResults({ query, hits }: { query: string; hits: MarketplaceProductHit[] }) {
  return (
    <section>
      <SectionHeading eyebrow="Sua busca" title={`Pratos encontrados (${hits.length})`} />
      {hits.length === 0 ? (
        <p className="rounded-[28px] border border-orange-100 bg-white py-9 text-center text-sm text-muted-foreground shadow-sm">
          Nenhum prato para &quot;{query}&quot;.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {hits.map((hit) => (
            <motion.div key={hit.product.id} variants={mobileCardItem}>
              <FeaturedProductCard {...hit} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
