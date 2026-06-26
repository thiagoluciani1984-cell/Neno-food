import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Images, MapPin, Star, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { ProductCard } from "@/features/catalog/components/product-card";
import { getMenuBySlug } from "@/features/catalog/queries";
import { getRestaurantFeedPosts } from "@/features/feed/queries";
import { PostCard } from "@/features/feed/components/post-card";
import { getRestaurantReviews, getReviewsSummary, getCustomerReview } from "@/features/reviews/queries";
import { isRestaurantFavorited } from "@/features/favorites/queries";
import { ReviewsList } from "@/features/reviews/components/reviews-list";
import { RestaurantFavoriteButton } from "@/features/favorites/components/restaurant-favorite-button";
import { getSession } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";

interface Props {
  params: Promise<{ restaurantSlug: string }>;
  searchParams: Promise<{ aba?: string }>;
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
  const { aba } = await searchParams;
  const tab =
    aba === "publicacoes"
      ? "publicacoes"
      : aba === "avaliacoes"
        ? "avaliacoes"
        : "cardapio";

  const menu = await getMenuBySlug(restaurantSlug);
  if (!menu) notFound();

  const { restaurant, settings, categories } = menu;

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

  const tabLink = (t: string) =>
    t === "cardapio" ? `/${restaurantSlug}` : `/${restaurantSlug}?aba=${t}`;

  return (
    <div className="bg-[#f6f7f9]">
      <section className="relative overflow-hidden border-b bg-[#1f1f1f] text-white">
        {restaurant.cover_url && (
          <Image
            src={restaurant.cover_url}
            alt={restaurant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

        <div className="container relative py-14 sm:py-20">
          <Badge variant="gold" className="mb-4 rounded-full">
            {restaurant.cuisine ?? "Restaurante"}
          </Badge>

          <div className="flex items-start justify-between gap-4 max-w-3xl">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                  {restaurant.description}
                </p>
              )}
            </div>
            {profile && (
              <div className="shrink-0 pt-1">
                <RestaurantFavoriteButton
                  restaurantId={restaurant.id}
                  restaurantSlug={restaurantSlug}
                  initialFavorited={isFavorited}
                />
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-white">
              <Star className="h-4 w-4 fill-[#FFB300] text-[#FFB300]" />
              {restaurant.avg_rating > 0
                ? `${restaurant.avg_rating.toFixed(1)} (${restaurant.total_reviews})`
                : settings?.is_open ? "Aberto agora" : "Fechado"}
            </span>
            {settings && (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-white">
                  <Clock className="h-4 w-4" /> ~{settings.avg_prep_minutes} min
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-white">
                  <MapPin className="h-4 w-4" /> Entrega{" "}
                  {settings.delivery_fee_cents === 0
                    ? "gratis"
                    : formatBRL(settings.delivery_fee_cents)}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b bg-white/95 backdrop-blur">
        <div className="container flex gap-0">
          <Link
            href={tabLink("cardapio")}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              tab === "cardapio"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Cardápio
          </Link>
          <Link
            href={tabLink("publicacoes")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              tab === "publicacoes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Images className="h-4 w-4" />
            Publicações
          </Link>
          <Link
            href={tabLink("avaliacoes")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              tab === "avaliacoes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Star className="h-4 w-4" />
            Avaliações
            {restaurant.total_reviews > 0 && (
              <span className="ml-0.5 text-xs text-muted-foreground">
                ({restaurant.total_reviews})
              </span>
            )}
          </Link>
        </div>
      </div>

      {tab === "cardapio" && (
        <>
          {categories.length > 0 && (
            <nav className="border-b bg-white">
              <div className="container flex gap-2 overflow-x-auto py-3 scrollbar-hide">
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#cat-${cat.slug}`}
                    className="whitespace-nowrap rounded-full border bg-[#f6f7f9] px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </nav>
          )}

          <div className="container space-y-10 py-8">
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
                <h2 className="mb-4 text-2xl font-bold">{cat.name}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {cat.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      restaurantId={restaurant.id}
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
    </div>
  );
}
