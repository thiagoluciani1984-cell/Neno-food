"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/shared/rating-stars";
import { submitReviewAction } from "../actions";

interface ReviewFormProps {
  restaurantId: string;
  restaurantName: string;
  orderId?: string;
  existingReview?: { id: string; rating: number; comment: string | null };
  trigger?: React.ReactNode;
}

export function ReviewForm({
  restaurantId,
  restaurantName,
  orderId,
  existingReview,
  trigger,
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Selecione ao menos 1 estrela.");
      return;
    }
    startTransition(async () => {
      const result = await submitReviewAction(
        restaurantId,
        rating,
        comment,
        orderId,
        existingReview?.id
      );
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(existingReview ? "Avaliação atualizada!" : "Avaliação enviada!");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            {existingReview ? "Editar avaliação" : "Avaliar restaurante"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Editar avaliação" : "Avaliar"} — {restaurantName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-sm text-muted-foreground">Sua nota</p>
            <RatingStars
              value={rating}
              interactive
              onChange={setRating}
              size="lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Comentário (opcional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi a sua experiência…"
              maxLength={500}
              rows={4}
            />
            <p className="text-right text-xs text-muted-foreground">
              {comment.length}/500
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={pending || rating === 0}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingReview ? "Salvar alterações" : "Enviar avaliação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
