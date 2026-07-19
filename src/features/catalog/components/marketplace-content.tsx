"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
import {
  Bike,
  Clock,
  Coffee,
  Heart,
  IceCreamBowl,
  Pizza,
  Plus,
  ShoppingBasket,
  Soup,
  Star,
  Tags,
  UtensilsCrossed,
} from "lucide-react";
import { formatBRL } from "@/lib/money";
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
  { label: "Todos", icon: UtensilsCrossed, filter: null },
  { label: "Burger", icon: UtensilsCrossed, filter: "hamburguer" },
  { label: "Pizza", icon: Pizza, filter: "pizza" },
  { label: "Bebidas", icon: Coffee, filter: "bebidas" },
  { label: "Doces", icon: IceCreamBowl, filter: "sobremesas" },
  { label: "Promo", icon: Tags, filter: "promocoes" },
  { label: "Lanches", icon: Soup, filter: "lanches" },
  { label: "Mercado", icon: ShoppingBasket, filter: "mercado" },
] as const;

const QUICK_FILTERS = ["Aberto agora", "Entrega gratis", "Mais pedidos"] as const;
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
  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

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
    const t = window.setInterval(
      () => setActiveSlide((s) => (s + 1) % marketplacePromos.length),
      5000
    );
    return () => window.clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let list = restaurants.filter(({ restaurant, settings }) => {
      const cuisine = restaurant.cuisine ?? "";
      const matchesQuery =
        !normalizedQuery ||
        restaurant.name.toLowerCase().includes(normalizedQuery) ||
        cuisine.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        !activeCategory ||
        cuisine.toLowerCase().includes(activeCategory) ||
        restaurant.name.toLowerCase().includes(activeCategory);
      const matchesQuickFilter =
        !activeQuickFilter ||
        (activeQuickFilter === "Aberto agora" && settings?.is_open === true) ||
        (activeQuickFilter === "Entrega gratis" && (settings?.delivery_fee_cents ?? 0) === 0) ||
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
    <div className="min-h-screen bg-[#FFFAF4] pb-4">
      <motion.div
        variants={orchestratorVariants}
        initial="initial"
        animate="animate"
        className="container space-y-7 py-4 sm:py-8 lg:space-y-10 lg:py-12"
      >
        <motion.div
          variants={searchVariants}
          className="lg:grid lg:grid-cols-2 lg:items-end lg:gap-12"
        >
          <div className="hidden lg:block">
            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              Sabores escolhidos para você
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground xl:text-[2.75rem]">
              Sua próxima experiência gastronômica começa aqui.
            </h1>
          </div>
          <div className="lg:pb-0.5">
            <MarketplaceSearchBar value={query} onChange={setQuery} />
          </div>
        </motion.div>

        {/* Banner promo */}
        <motion.section variants={sectionVariants}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              variants={promoBannerMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden rounded-[28px] shadow-nenos-elevated sm:rounded-[32px]"
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

        {/* Filtros rápidos */}
        <motion.div variants={sectionVariants} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_FILTERS.map((item) => {
            const active = activeQuickFilter === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setActiveQuickFilter(active ? null : item)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "border border-orange-100 bg-white text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary"
                }`}
              >
                {item}
              </button>
            );
          })}
        </motion.div>

        {/* Categorias */}
        <motion.section variants={sectionVariants}>
          <SectionHeading eyebrow="EXPLORE" title="O que combina com você?" />
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.filter;
              return (
                <motion.button
                  key={cat.label}
                  type="button"
                  variants={mobileCardItem}
                  onClick={() => setActiveCategory(isActive ? null : cat.filter)}
                  className="flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-2xl p-0.5 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-95"
                >
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-all ${
                      isActive
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                        : "border-orange-100/80 bg-white text-primary shadow-sm hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span
                    className={`text-center text-[11px] font-bold leading-tight ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Resultados de busca */}
        {initialQuery.length >= 2 && (
          <motion.div variants={sectionVariants}>
            <SearchResults query={initialQuery} hits={initialProductHits} />
          </motion.div>
        )}

        {/* Restaurantes populares — scroll horizontal */}
        {!initialQuery && filtered.length > 0 && (
          <motion.section variants={sectionVariants}>
            <SectionHeading
              eyebrow="MAIS QUERIDOS"
              title="Restaurantes populares"
              action={
                <Link href="/?busca=1" className="text-xs font-bold text-primary hover:underline">
                  Ver todos
                </Link>
              }
            />
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            >
              {filtered.map((card) => (
                <motion.div key={card.restaurant.id} variants={mobileCardItem} className="shrink-0">
                  <PopularRestaurantCard {...card} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Destaques para você */}
        {!initialQuery && featuredProducts.length > 0 && (
          <motion.section variants={sectionVariants}>
            <SectionHeading eyebrow="SELEÇÃO NENOS" title="Destaques para você" />
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-4 sm:grid-cols-2"
            >
              {featuredProducts.map((hit) => (
                <motion.div key={hit.product.id} variants={mobileCardItem}>
                  <FeaturedProductCard {...hit} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Grid completo */}
        <motion.section variants={sectionVariants}>
          <h2 className="mb-3 text-base font-extrabold sm:text-lg">
            {activeCategory || query ? `Resultados (${filtered.length})` : "Todos os restaurantes"}
          </h2>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: nenosEase }}
              className="rounded-[28px] border border-orange-100 bg-white py-10 text-center"
            >
              <Image
                src="/brand/mascot/empty-state.webp"
                alt=""
                width={480}
                height={434}
                className="mx-auto mb-2 h-36 w-auto"
              />
              <p className="font-semibold text-muted-foreground">Nenhum restaurante encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Tenta outro termo ou categoria</p>
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
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/70">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-0.5 text-base font-extrabold text-foreground sm:text-lg">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function PopularRestaurantCard({ restaurant, settings }: RestaurantCard) {
  const isOpen = settings?.is_open ?? false;
  return (
    <Link
      href={`/${restaurant.slug}`}
      className="group w-[270px] shrink-0 overflow-hidden rounded-[28px] border border-orange-100/70 bg-white shadow-nenos-elevated transition-transform hover-nenos-lift"
    >
      <div className="relative h-40 bg-muted">
        {restaurant.cover_url ? (
          <Image
            src={restaurant.cover_url}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="270px"
          />
        ) : (
          <div className="flex h-full items-center justify-center nenos-gradient-diagonal opacity-80" />
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
            isOpen ? "bg-green-500 text-white" : "bg-black/60 text-white"
          }`}
        >
          {isOpen ? "Aberto" : "Fechado"}
        </span>
        <button
          type="button"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={(e) => e.preventDefault()}
          aria-label="Favoritar"
        >
          <Heart className="h-4 w-4" />
        </button>
        {restaurant.logo_url && (
          <div className="absolute -bottom-5 left-4 h-12 w-12 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md">
            <Image src={restaurant.logo_url} alt="" fill className="object-cover" sizes="48px" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-4 pt-7">
        <h3 className="truncate font-extrabold leading-tight text-foreground group-hover:text-primary">
          {restaurant.name}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{restaurant.cuisine}</p>
        <div className="flex items-center gap-3 border-t border-orange-50 pt-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-bold text-foreground">
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
            {restaurant.avg_rating > 0 ? restaurant.avg_rating.toFixed(1) : "4.8"}
          </span>
          {settings?.avg_prep_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {settings.avg_prep_minutes} min
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FeaturedProductCard({ product, restaurant }: MarketplaceProductHit) {
  const price = product.promo_price_cents ?? product.price_cents;
  return (
    <Link
      href={`/${restaurant.slug}?produto=${product.slug}`}
      className="group flex gap-4 overflow-hidden rounded-[28px] border border-orange-100/70 bg-white p-3 shadow-nenos-elevated transition-transform hover-nenos-lift"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-28 sm:w-28">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 96px, 112px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-orange-50">
            <UtensilsCrossed className="h-8 w-8 text-primary/30" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">
          Destaque
        </span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-xs font-bold text-primary">{restaurant.name}</p>
        <h3 className="truncate font-extrabold leading-tight text-foreground group-hover:text-primary">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
        )}
        <p className="mt-2 text-base font-extrabold text-primary">{formatBRL(price)}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 self-center items-center justify-center rounded-full bg-primary text-white shadow-orange">
        <Plus className="h-5 w-5" />
      </span>
    </Link>
  );
}

function RestaurantGridCard({ restaurant, settings }: RestaurantCard) {
  const isOpen = settings?.is_open ?? false;
  return (
    <Link
      href={`/${restaurant.slug}`}
      className="group overflow-hidden rounded-[28px] border border-orange-100/70 bg-white shadow-nenos-elevated transition-transform hover-nenos-lift"
    >
      <div className="relative h-44 bg-muted">
        {restaurant.cover_url ? (
          <Image
            src={restaurant.cover_url}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-orange-50">
            <UtensilsCrossed className="h-12 w-12 text-primary/25" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
            isOpen ? "bg-green-500 text-white" : "bg-black/60 text-white"
          }`}
        >
          {isOpen ? "Aberto" : "Fechado"}
        </span>
        {restaurant.logo_url && (
          <div className="absolute -bottom-5 left-4 h-12 w-12 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md">
            <Image src={restaurant.logo_url} alt="" fill className="object-cover" sizes="48px" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-4 pt-7">
        <h3 className="truncate font-extrabold leading-tight text-foreground group-hover:text-primary">
          {restaurant.name}
        </h3>
        <p className="text-xs text-muted-foreground">{restaurant.cuisine}</p>
        <div className="flex items-center gap-3 border-t border-orange-50 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-bold text-foreground">
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
            {restaurant.avg_rating > 0 ? restaurant.avg_rating.toFixed(1) : "—"}
          </span>
          {settings?.avg_prep_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {settings.avg_prep_minutes} min
            </span>
          )}
          {settings && (
            <span className="flex items-center gap-1">
              <Bike className="h-3.5 w-3.5" />
              {settings.delivery_fee_cents === 0 ? "Grátis" : formatBRL(settings.delivery_fee_cents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SearchResults({
  query,
  hits,
}: {
  query: string;
  hits: MarketplaceProductHit[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-extrabold">Pratos ({hits.length})</h2>
      {hits.length === 0 ? (
        <p className="rounded-3xl border bg-white py-8 text-center text-sm text-muted-foreground">
          Nenhum prato para &quot;{query}&quot;
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
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
