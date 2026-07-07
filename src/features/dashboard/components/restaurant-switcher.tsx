"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setDashboardRestaurantAction } from "@/features/dashboard/actions";

export function RestaurantSwitcher({
  restaurants,
  activeSlug,
}: {
  restaurants: Array<{ id: string; name: string; slug: string }>;
  activeSlug?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (restaurants.length <= 1) return null;

  function select(slug: string) {
    if (slug === activeSlug || pending) return;

    startTransition(async () => {
      const result = await setDashboardRestaurantAction(slug);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível trocar de restaurante.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {restaurants.map((restaurant) => {
        const active = restaurant.slug === activeSlug;

        return (
          <button
            key={restaurant.id}
            type="button"
            disabled={pending}
            onClick={() => select(restaurant.slug)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/40"
            )}
          >
            {restaurant.name}
          </button>
        );
      })}
    </div>
  );
}
