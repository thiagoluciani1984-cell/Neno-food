"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bike,
  Clock,
  Coffee,
  IceCreamBowl,
  Pizza,
  Search,
  ShoppingBasket,
  Soup,
  Sparkles,
  Star,
  Tags,
  UtensilsCrossed,
} from "lucide-react";
import { formatBRL } from "@/lib/money";
import type { RestaurantCard } from "@/features/catalog/queries-marketplace";

const CATEGORIES = [
  { label: "Hamburguer", icon: UtensilsCrossed, filter: "hamburguer" },
  { label: "Pizza", icon: Pizza, filter: "pizza" },
  { label: "Bebidas", icon: Coffee, filter: "bebidas" },
  { label: "Sobremesas", icon: IceCreamBowl, filter: "sobremesas" },
  { label: "Promocoes", icon: Tags, filter: "promocoes" },
  { label: "Lanches", icon: Soup, filter: "lanches" },
  { label: "Pratos", icon: UtensilsCrossed, filter: "pratos" },
  { label: "Mercado", icon: ShoppingBasket, filter: "mercado" },
];

const QUICK_FILTERS = ["Aberto agora", "Entrega gratis", "Mais pedidos"];

export function MarketplaceContent({
  restaurants,
}: {
  restaurants: RestaurantCard[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return restaurants.filter(({ restaurant }) => {
      const cuisine = restaurant.cuisine ?? "";
      const matchesQuery =
        !normalizedQuery ||
        restaurant.name.toLowerCase().includes(normalizedQuery) ||
        cuisine.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        !activeCategory ||
        cuisine.toLowerCase().includes(activeCategory) ||
        restaurant.name.toLowerCase().includes(activeCategory);

      return matchesQuery && matchesCategory;
    });
  }, [restaurants, query, activeCategory]);

  const featuredRestaurant = filtered[0];

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-foreground">
      <section className="border-b bg-white">
        <div className="container grid gap-8 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-10">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-[#fff8e1] px-3 py-1 text-xs font-semibold text-[#8a5a00]">
              <Sparkles className="h-3.5 w-3.5" />
              Restaurantes selecionados para hoje
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-normal text-[#1f1f1f] sm:text-4xl lg:text-5xl">
              Comida boa, sem espera e com cara de app grande.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Encontre restaurantes, ofertas e pratos favoritos em uma vitrine mais limpa, rapida e facil de navegar.
            </p>

            <div className="mt-6 rounded-lg border bg-white p-2 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar restaurante, prato ou categoria"
                  className="h-12 w-full rounded-md border-0 bg-[#f6f7f9] pl-11 pr-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="relative hidden min-h-[320px] overflow-hidden rounded-lg border bg-[#1f1f1f] shadow-sm lg:block">
            {featuredRestaurant?.restaurant.cover_url ? (
              <Image
                src={featuredRestaurant.restaurant.cover_url}
                alt={featuredRestaurant.restaurant.name}
                fill
                priority
                sizes="520px"
                className="object-cover opacity-85"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,179,0,0.28),transparent_28%),linear-gradient(135deg,#242424,#111)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                Destaque da vitrine
              </p>
              <h2 className="text-2xl font-bold">
                {featuredRestaurant?.restaurant.name ?? "Nenos Food"}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/75">
                {featuredRestaurant?.restaurant.description ??
                  "Uma experiencia de delivery moderna, direta e pronta para vender."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container max-w-6xl space-y-8 py-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Categorias</h2>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => setActiveCategory(null)}
            >
              {activeCategory ? "Limpar filtro" : "Ver todas"}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.filter;

              return (
                <button
                  key={cat.filter}
                  type="button"
                  onClick={() =>
                    setActiveCategory(isActive ? null : cat.filter)
                  }
                  className={`flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-lg border bg-white px-2 py-3 text-center transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-semibold leading-tight">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <PromoPanel
            title="Combo do dia"
            subtitle="Selecao rapida para pedir sem pensar muito."
            tone="red"
          />
          <PromoPanel
            title="Entrega inteligente"
            subtitle="Veja restaurantes com frete competitivo e preparo agil."
            tone="yellow"
          />
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {activeCategory || query
                  ? `Resultados (${filtered.length})`
                  : "Restaurantes perto de voce"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Compare tempo, frete e especialidade em poucos segundos.
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-white py-16 text-center">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-semibold text-muted-foreground">
                Nenhum restaurante encontrado
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() => {
                  setQuery("");
                  setActiveCategory(null);
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(({ restaurant, settings }) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  settings={settings}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PromoPanel({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: "red" | "yellow";
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border p-5 ${
        tone === "red"
          ? "border-primary/15 bg-primary text-white"
          : "border-[#ffb300]/25 bg-[#fff8e1] text-[#4b3700]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
        Oferta
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold">{title}</h3>
          <p className="mt-1 max-w-sm text-sm opacity-80">{subtitle}</p>
        </div>
        <Tags className="h-8 w-8 shrink-0 opacity-75" />
      </div>
    </div>
  );
}

function RestaurantCard({
  restaurant,
  settings,
}: Pick<RestaurantCard, "restaurant" | "settings">) {
  const isOpen = settings?.is_open ?? false;

  return (
    <Link
      href={`/${restaurant.slug}`}
      className="group block overflow-hidden rounded-lg border bg-white transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-40 bg-muted">
        {restaurant.cover_url ? (
          <Image
            src={restaurant.cover_url}
            alt={restaurant.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f1f2f4]">
            <UtensilsCrossed className="h-12 w-12 text-primary/25" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isOpen ? "bg-white text-green-700" : "bg-black/65 text-white"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOpen ? "bg-green-500" : "bg-red-400"
            }`}
          />
          {isOpen ? "Aberto" : "Fechado"}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight text-foreground group-hover:text-primary">
              {restaurant.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {restaurant.cuisine ?? "Restaurante"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#fff8e1] px-2 py-1 text-[#8a5a00]">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-bold">4.8</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
          {settings?.avg_prep_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {settings.avg_prep_minutes}-{settings.avg_prep_minutes + 10} min
            </span>
          )}

          {settings && (
            <span className="flex items-center gap-1">
              <Bike className="h-3.5 w-3.5" />
              {settings.delivery_fee_cents === 0
                ? "Gratis"
                : formatBRL(settings.delivery_fee_cents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
