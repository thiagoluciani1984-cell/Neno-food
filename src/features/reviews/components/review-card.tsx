"use client";

import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/rating-stars";
import { cn } from "@/lib/utils";
import { deleteReviewAction } from "../actions";
import type { Review } from "../queries";

interface ReviewCardProps {
  review: Review;
  restaurantId: string;
  isOwn?: boolean;
  className?: string;
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d} dias`;
  const m = Math.floor(d / 30);
  if (m < 12) return `há ${m} ${m === 1 ? "mês" : "meses"}`;
  const y = Math.floor(m / 12);
  return `há ${y} ${y === 1 ? "ano" : "anos"}`;
}

export function ReviewCard({ review, restaurantId, isOwn, className }: ReviewCardProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Remover sua avaliação?")) return;
    startTransition(async () => {
      const result = await deleteReviewAction(review.id, restaurantId);
      if ("error" in result) toast.error(result.error);
      else toast.success("Avaliação removida.");
    });
  }

  return (
    <div className={cn("space-y-2 rounded-xl border bg-white p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
            {review.author.avatar_url ? (
              <Image
                src={review.author.avatar_url}
                alt={review.author.full_name}
                fill
                className="object-cover"
                sizes="36px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                {review.author.full_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{review.author.full_name}</p>
            <p className="text-xs text-muted-foreground">{relativeDate(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RatingStars value={review.rating} size="sm" showValue />
          {isOwn && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-foreground/80">{review.comment}</p>
      )}

      {review.reply && (
        <div className="mt-2 flex gap-2 rounded-lg bg-muted/60 p-3">
          <MessageSquareReply className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold text-primary">Resposta do restaurante</p>
            <p className="mt-0.5 text-sm text-foreground/80">{review.reply}</p>
          </div>
        </div>
      )}
    </div>
  );
}
