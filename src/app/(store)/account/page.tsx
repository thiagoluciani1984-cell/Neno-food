import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Star, Heart, MapPin, Package, Bookmark } from "lucide-react";
import { getSession } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { logoutAction } from "@/features/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/core/domain/value-objects/order-status";
import { RatingStars } from "@/components/shared/rating-stars";
import { cn } from "@/lib/utils";
import { getCustomerAddresses } from "@/features/addresses/queries";
import { getCustomerFavoriteProducts, getCustomerFavoriteRestaurants } from "@/features/favorites/queries";
import { getCustomerReviews } from "@/features/reviews/queries";
import { AddressCard } from "@/features/addresses/components/address-card";
import { AddressForm } from "@/features/addresses/components/address-form";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { getSavedPostsForProfile } from "@/features/feed/queries";
import { PostCard } from "@/features/feed/components/post-card";
import type { Order } from "@/types/database.types";

export const metadata: Metadata = { title: "Minha conta" };

type Tab = "pedidos" | "favoritos" | "salvos" | "enderecos" | "avaliacoes";
const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "salvos", label: "Salvos", icon: Bookmark },
  { id: "enderecos", label: "Endereços", icon: MapPin },
  { id: "avaliacoes", label: "Avaliações", icon: Star },
];

interface Props {
  searchParams: Promise<{ aba?: string }>;
}

export default async function AccountPage({ searchParams }: Props) {
  const { aba } = await searchParams;
  const tab: Tab = (["pedidos", "favoritos", "salvos", "enderecos", "avaliacoes"].includes(aba ?? "")
    ? aba
    : "pedidos") as Tab;

  const { user, profile } = await getSession();
  if (!user) redirect("/login?redirect=/account");

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle<{ id: string }>();

  const customerId = customer?.id;

  const [orders, addresses, favProducts, favRestaurants, myReviews, savedPosts] =
    await Promise.all([
    tab === "pedidos" && customerId
      ? supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data }) => (data ?? []) as Order[])
      : Promise.resolve([] as Order[]),
    tab === "enderecos" && customerId
      ? getCustomerAddresses(customerId)
      : Promise.resolve([]),
    tab === "favoritos" && customerId
      ? getCustomerFavoriteProducts(customerId)
      : Promise.resolve([]),
    tab === "favoritos" && customerId
      ? getCustomerFavoriteRestaurants(customerId)
      : Promise.resolve([]),
    tab === "avaliacoes" && customerId
      ? getCustomerReviews(customerId)
      : Promise.resolve([]),
    tab === "salvos" && profile?.id
      ? getSavedPostsForProfile(profile.id)
      : Promise.resolve([]),
  ]);

  return (
    <div className="container max-w-2xl py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {profile?.full_name?.split(" ")[0] || "cliente"}
          </h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            Sair
          </Button>
        </form>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={id === "pedidos" ? "/account" : `/account?aba=${id}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              tab === id
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* ── Pedidos ── */}
      {tab === "pedidos" && (
        <Card>
          <CardHeader>
            <CardTitle>Meus pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/order/${o.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div>
                  <p className="font-medium">#{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={ORDER_STATUS_COLOR[o.status]}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </Badge>
                  <span className="font-semibold">{formatBRL(o.total_cents)}</span>
                </div>
              </Link>
            ))}
            {orders.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Você ainda não fez pedidos.{" "}
                <Link href="/" className="text-primary hover:underline">
                  Ver restaurantes
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Favoritos ── */}
      {tab === "favoritos" && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-semibold">Restaurantes</h2>
            {favRestaurants.length === 0 ? (
              <p className="rounded-xl border bg-white py-8 text-center text-sm text-muted-foreground">
                Nenhum restaurante favoritado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {favRestaurants.map((r) => (
                  <Link
                    key={r.id}
                    href={`/${r.slug}`}
                    className="flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors hover:bg-accent"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {r.logo_url ? (
                        <Image
                          src={r.logo_url}
                          alt={r.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
                          {r.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.cuisine}</p>
                    </div>
                    {r.avg_rating > 0 && (
                      <RatingStars value={r.avg_rating} size="sm" showValue />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 font-semibold">Pratos</h2>
            {favProducts.length === 0 ? (
              <p className="rounded-xl border bg-white py-8 text-center text-sm text-muted-foreground">
                Nenhum prato favoritado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {favProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/${p.restaurant.slug}?produto=${p.slug}`}
                    className="flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors hover:bg-accent"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg">
                          🍽️
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.restaurant.name}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-primary">
                      {formatBRL(p.price_cents)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Posts salvos ── */}
      {tab === "salvos" && (
        <div className="space-y-4">
          <h2 className="font-semibold">Posts salvos</h2>
          {savedPosts.length === 0 ? (
            <p className="rounded-xl border bg-white py-10 text-center text-sm text-muted-foreground">
              Nenhum post salvo ainda.{" "}
              <Link href="/feed" className="text-primary hover:underline">
                Explorar feed
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Endereços ── */}
      {tab === "enderecos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Meus endereços</h2>
            <AddressForm />
          </div>
          {addresses.length === 0 ? (
            <div className="rounded-xl border bg-white py-10 text-center">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
              <p className="text-xs text-muted-foreground">
                Adicione um para facilitar seus pedidos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <AddressCard key={addr.id} address={addr} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Avaliações ── */}
      {tab === "avaliacoes" && (
        <div className="space-y-3">
          <h2 className="font-semibold">Minhas avaliações</h2>
          {myReviews.length === 0 ? (
            <div className="rounded-xl border bg-white py-10 text-center">
              <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Você ainda não avaliou nenhum restaurante.
              </p>
              <p className="text-xs text-muted-foreground">
                Depois de um pedido, você pode deixar sua avaliação.
              </p>
            </div>
          ) : (
            myReviews.map((review) => (
              <div key={review.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/${review.restaurant.slug}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {review.restaurant.logo_url ? (
                        <Image
                          src={review.restaurant.logo_url}
                          alt={review.restaurant.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-bold text-muted-foreground">
                          {review.restaurant.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{review.restaurant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <RatingStars value={review.rating} size="sm" showValue />
                    <ReviewForm
                      restaurantId={review.restaurant.id}
                      restaurantName={review.restaurant.name}
                      existingReview={{
                        id: review.id,
                        rating: review.rating,
                        comment: review.comment,
                      }}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Editar
                        </Button>
                      }
                    />
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
