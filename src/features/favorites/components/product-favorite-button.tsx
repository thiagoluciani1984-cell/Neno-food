"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleProductFavoriteAction } from "../actions";

interface ProductFavoriteButtonProps {
  productId: string;
  initialFavorited: boolean;
  className?: string;
}

export function ProductFavoriteButton({
  productId,
  initialFavorited,
  className,
}: ProductFavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleProductFavoriteAction(productId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setFavorited(result.favorited);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
      className={cn(
        "rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none",
        pending && "opacity-50",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          favorited ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
        )}
      />
    </button>
  );
}
