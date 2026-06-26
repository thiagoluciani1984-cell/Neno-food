import { Star } from "lucide-react";
import { getRestaurantReviews, getReviewsSummary } from "../queries";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";

interface ReviewsListProps {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  currentCustomerId?: string;
  currentReview?: { id: string; rating: number; comment: string | null } | null;
}

function RatingBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-[#FFB300] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export async function ReviewsList({
  restaurantId,
  restaurantName,
  restaurantSlug,
  currentCustomerId,
  currentReview,
}: ReviewsListProps) {
  const [reviews, summary] = await Promise.all([
    getRestaurantReviews(restaurantId),
    getReviewsSummary(restaurantId),
  ]);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-1 sm:w-40 sm:border-r sm:pr-5">
          <span className="text-5xl font-extrabold text-foreground">
            {summary.avg > 0 ? summary.avg.toFixed(1) : "–"}
          </span>
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(summary.avg)
                    ? "fill-[#FFB300] text-[#FFB300]"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {summary.total} {summary.total === 1 ? "avaliação" : "avaliações"}
          </span>
        </div>

        <div className="flex-1 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="w-4 text-right text-xs font-medium">{star}</span>
              <Star className="h-3 w-3 fill-[#FFB300] text-[#FFB300]" />
              <RatingBar count={summary.distribution[star]} total={summary.total} />
              <span className="w-6 text-xs text-muted-foreground">
                {summary.distribution[star]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA avaliar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {reviews.length > 0 ? "O que dizem os clientes" : "Seja o primeiro a avaliar"}
        </h3>
        <ReviewForm
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          existingReview={currentReview ?? undefined}
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            restaurantId={restaurantId}
            isOwn={review.author.id === currentCustomerId}
          />
        ))}
        {reviews.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma avaliação ainda. Experimente e deixe a sua!
          </p>
        )}
      </div>
    </div>
  );
}
