"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient, getRealtimeAuthReady } from "@/infra/supabase/client";
import { playPositiveReviewAlert, playNegativeReviewAlert } from "@/lib/sound";

/**
 * Monta uma vez no layout do dashboard: avisa com som quando uma nova
 * avaliação chega (5 estrelas = positivo, 2 estrelas ou menos = negativo).
 * Não renderiza nada visível.
 */
export function ReviewAlertListener({ restaurantId }: { restaurantId: string }) {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void getRealtimeAuthReady().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`reviews-${restaurantId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "reviews",
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          (payload) => {
            const rating = (payload.new as { rating: number }).rating;
            if (rating >= 5) {
              playPositiveReviewAlert();
              toast.success("Você recebeu uma avaliação de 5 estrelas!");
            } else if (rating <= 2) {
              playNegativeReviewAlert();
              toast.warning("Você recebeu uma avaliação baixa — vale a pena conferir.");
            }
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return null;
}
