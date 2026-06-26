"use client";

import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setRestaurantStatusAction } from "@/features/admin/actions";
import type { Restaurant, RestaurantStatus } from "@/types/database.types";

const STATUS_VARIANT: Record<RestaurantStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  pending: "secondary",
  blocked: "destructive",
};

export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  async function setStatus(status: RestaurantStatus) {
    const res = await setRestaurantStatusAction(restaurant.id, status);
    toast[res.ok ? "success" : "error"](res.ok ? "Atualizado." : res.error ?? "Erro.");
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{restaurant.name}</p>
            <Badge variant={STATUS_VARIANT[restaurant.status]}>
              {restaurant.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">/{restaurant.slug}</p>
        </div>
        <div className="flex gap-2">
          {restaurant.status !== "active" && (
            <Button size="sm" onClick={() => setStatus("active")}>
              Aprovar
            </Button>
          )}
          {restaurant.status !== "blocked" && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={() => setStatus("blocked")}
            >
              Bloquear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
