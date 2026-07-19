import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Flame, Images, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { ProductCard } from "@/features/catalog/components/product-card";
import { getMenuBySlug } from "@/features/catalog/queries";
import { getRestaurantFeedPosts } from "@/features/feed/queries";
import { PostCard } from "@/features/feed/components/post-card";
import { getCustomerReview } from "@/features/reviews/queries";
import { isRestaurantFavorited } from "@/features/favorites/queries";
import { ReviewsList } from "@/features/reviews/components/reviews-list";
import { RestaurantFavoriteButton } from "@/features/favorites/components/restaurant-favorite-button";
import { getSession } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { RestaurantCartBar } from "@/features/cart/components/restaurant-cart-bar";
import { RestaurantHeroCard } from "@/features/catalog/components/restaurant-hero-card";
import { PointRestaurantHero } from "@/features/catalog/components/point-restaurant-hero";
import { RestaurantTabs } from "@/features/catalog/components/restaurant-tabs";
import { restaurantThemeStyle } from "@/lib/color";

interface Props {
  params: Promise<{ restaurantSlug: string }>;
  searchParams: Promise<{ aba?: string; produto?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const menu = await getMenuBySlug(restaurantSlug);

  return {
    title: menu?.restaurant.name ?? "Restaurante",
    description: menu?.restaurant.description ?? undefined,
  };
}

export default async function RestaurantPage({ params, searchParams }: Props) {
  const { restaurantSlug } = await params;
  const { aba, produto } = await searchParams;
  const tab =
    aba === "publicacoes"
      ? "publicacoes"
      : aba === "avaliacoes"
        ? "avaliacoes"
        : "cardapio";

  const menu = await getMenuBySlug(restaurantSlug);
  if (!menu) notFound();

  const { restaurant, settings, categories } = menu;
  const isRestaurantOpen = settings?.is_open ?? false;
  const deepLinkSlug = produto?.trim() || undefined;
  const isPoint = restaurant.slug === "poit-da-pizza";

  const { profile } = await getSession();
  const supabase = await createClient();

  // Resolve customer_id para verificar favorito e avaliação própria
  let customerId: string | null = null;
  let isFavorited = false;
  let currentReview: { id: string; rating: number; comment: string | null } | null = null;

  if (profile?.id) {
    const { data: cust } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle<{ id: string }>();
    customerId = cust?.id ?? null;

    if (customerId) {
      [isFavorited, currentReview] = await Promise.all([
        isRestaurantFavorited(customerId, restaurant.id),
        getCustomerReview(customerId, restaurant.id),
      ]);
    }
  }

  const posts =
    tab === "publicacoes" ? await getRestaurantFeedPosts(restaurant.id) : [];


  return (
    <div
      className={cn("pb-28", isPoint ? "bg-[#f4f1ec]" : "bg-[#FFF9F2]")}
      style={restaurantThemeStyle(restaurant)}
    >
      {/* Hero */}
      {isPoint ? (
        <PointRestaurantHero
          restaurantName={restaurant.name}
          logoUrl={restaurant.logo_url}
        />
      ) : (
        <section className="relative h-52 overflow-hidden sm:h-64">
          {restaurant.cover_url ? (
            <Image
              src={restaurant.cover_url}
              alt={restaurant.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 nenos-gradient-diagonal" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        </section>
      )}

      {/* Card sobreposto */}
      <div className="container relative z-10 -mt-16">
        <RestaurantHeroCard
          className={cn(
            isPoint &&
              "border border-white/10 bg-[#171512] text-white shadow-[0_28px_80px_rgba(16,12,8,0.28)]"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 shadow-sm",
                isPoint ? "border-primary/70 bg-black" : "border-orange-100 bg-orange-50"
              )}
            >
              {restaurant.logo_url ? (
                <Image
                  src={restaurant.logo_url}
                  alt=""
                  fill
                  className={isPoint ? "object-contain p-1" : "object-cover"}
                  sizes="64px"
                />
              ) : (
                <Image src="/brand/logo.png" alt="" fill className="object-contain p-1" sizes="64px" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={cn("text-xl font-extrabold sm:text-2xl", isPoint && "text-white")}>
                      {restaurant.name}
                    </h1>
                    <Badge
                      className={cn(
                        "rounded-full border-0 text-[10px] font-bold",
                        isRestaurantOpen
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      {isRestaurantOpen ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                  <p className={cn("mt-0.5 text-sm", isPoint ? "text-white/55" : "text-muted-foreground")}>
                    {restaurant.cuisine ?? "Restaurante"}
                    {restaurant.description && ` · ${restaurant.description.slice(0, 40)}…`}
                  </p>
                </div>
                {profile && (
                  <RestaurantFavoriteButton
                    restaurantId={restaurant.id}
                    restaurantSlug={restaurantSlug}
                    initialFavorited={isFavorited}
                  />
                )}
              </div>

              <div className={cn("mt-4 grid grid-cols-3 gap-2 border-t pt-4", isPoint ? "border-white/10" : "border-orange-50")}>
                <div className="text-center">
                  <p className={cn("flex items-center justify-center gap-1 text-sm font-extrabold", isPoint ? "text-white" : "text-foreground")}>
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    {restaurant.avg_rating > 0 ? restaurant.avg_rating.toFixed(1) : "—"}
                  </p>
                  <p className={cn("text-[10px]", isPoint ? "text-white/45" : "text-muted-foreground")}>Avaliação</p>
                </div>
                <div className={cn("border-x text-center", isPoint ? "border-white/10" : "border-orange-50")}>
                  <p className={cn("text-sm font-extrabold", isPoint ? "text-white" : "text-foreground")}>
                    {settings?.avg_prep_minutes ? `${settings.avg_prep_minutes} min` : "—"}
                  </p>
                  <p className={cn("text-[10px]", isPoint ? "text-white/45" : "text-muted-foreground")}>Entrega</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-primary">
                    {settings?.delivery_fee_cents === 0
                      ? "Grátis"
                      : settings
                        ? formatBRL(settings.delivery_fee_cents)
                        : "—"}
                  </p>
                  <p className={cn("text-[10px]", isPoint ? "text-white/45" : "text-muted-foreground")}>Frete</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "mt-4 flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm",
              isPoint ? "bg-primary text-white" : "bg-orange-50"
            )}
          >
            <span className={cn("font-semibold", isPoint ? "text-white" : "text-[#9A3412]")}>
              {isPoint ? "Ofertas para compartilhar" : "🎉 Promoções disponíveis"}
            </span>
            <Link
              href={`/${restaurantSlug}/checkout`}
              className={cn("font-bold", isPoint ? "text-white" : "text-primary")}
            >
              Ver ofertas →
            </Link>
          </div>
        </RestaurantHeroCard>
      </div>

      <RestaurantTabs
        slug={restaurantSlug}
        active={tab}
        reviewsCount={restaurant.total_reviews}
        premiumDark={isPoint}
      />

      {tab === "cardapio" && (
        <>
          {categories.length > 0 && (
            <nav className={cn("border-b", isPoint ? "border-black/10 bg-[#211e1a]" : "bg-white")}>
              <div className="container flex gap-2 overflow-x-auto py-3 scrollbar-hide">
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#cat-${cat.slug}`}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      isPoint
                        ? "border-white/10 bg-white/[0.06] text-white/65 hover:border-primary hover:bg-primary hover:text-white"
                        : "border-orange-100 bg-[#FFF9F2] text-muted-foreground hover:border-primary/40 hover:bg-orange-50 hover:text-primary"
                    )}
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </nav>
          )}

          <div className={cn("container space-y-10", isPoint ? "py-10 sm:py-14" : "py-8")}>
            {isPoint && (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Flame, title: "Forno no ponto", text: "Pizzas preparadas para chegar quentes" },
                  { icon: ShieldCheck, title: "Ingredientes selecionados", text: "Sabor e qualidade em cada pedido" },
                  { icon: Clock, title: "Pedido sem complicação", text: "Escolha, personalize e acompanhe" },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[#211e1a]">{title}</p>
                      <p className="text-xs text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {categories.length === 0 && (
              <p className="py-16 text-center text-muted-foreground">
                Cardápio em breve.
              </p>
            )}
            {categories.map((cat) => (
              <section
                key={cat.id}
                id={`cat-${cat.slug}`}
                className="scroll-mt-36"
              >
                {isPoint ? (
                  <div className="mb-5 flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_6px_rgba(234,88,12,0.12)]" />
                    <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#211e1a] sm:text-xl">
                      {cat.name}
                    </h2>
                    <span className="h-px flex-1 bg-gradient-to-r from-black/15 to-transparent" />
                  </div>
                ) : (
                  <h2 className="mb-4 inline-block rounded-full bg-primary px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground sm:text-base">
                    {cat.name}
                  </h2>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {cat.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      restaurantId={restaurant.id}
                      restaurantSlug={restaurantSlug}
                      deepLinkSlug={deepLinkSlug}
                      isOpen={isRestaurantOpen}
                      premium={isPoint}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {tab === "publicacoes" && (
        <div className="container max-w-xl py-8">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-white py-20 text-center">
              <Images className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "avaliacoes" && (
        <div className="container max-w-2xl py-8">
          <ReviewsList
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            restaurantSlug={restaurantSlug}
            currentCustomerId={profile?.id}
            currentReview={currentReview}
          />
        </div>
      )}
      <RestaurantCartBar restaurantSlug={restaurantSlug} />
    </div>
  );
}
