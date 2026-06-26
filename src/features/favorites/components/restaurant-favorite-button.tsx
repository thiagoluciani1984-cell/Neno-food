"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleRestaurantFavoriteAction } from "../actions";

interface RestaurantFavoriteButtonProps {
  restaurantId: string;
  restaurantSlug: string;
  initialFavorited: boolean;
  className?: string;
}

export function RestaurantFavoriteButton({
  restaurantId,
  restaurantSlug,
  initialFavorited,
  className,
}: RestaurantFavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleRestaurantFavoriteAction(restaurantId, restaurantSlug);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setFavorited(result.favorited);
        toast.success(result.favorited ? "Adicionado aos favoritos" : "Removido dos favoritos");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("rounded-full bg-white/90 backdrop-blur-sm", className)}
      onClick={handleToggle}
      disabled={pending}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          favorited ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
