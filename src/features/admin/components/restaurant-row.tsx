"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignRestaurantOwnerAction,
  setRestaurantStatusAction,
} from "@/features/admin/actions";
import type { Restaurant, RestaurantStatus } from "@/types/database.types";

const STATUS_VARIANT: Record<RestaurantStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  pending: "secondary",
  blocked: "destructive",
};

export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const [email, setEmail] = useState("");
  const [assigning, setAssigning] = useState(false);

  async function setStatus(status: RestaurantStatus) {
    const res = await setRestaurantStatusAction(restaurant.id, status);
    toast[res.ok ? "success" : "error"](res.ok ? "Atualizado." : res.error ?? "Erro.");
  }

  async function assignOwner() {
    setAssigning(true);
    const res = await assignRestaurantOwnerAction(restaurant.id, email);
    setAssigning(false);
    if (res.ok) {
      toast.success("Dono vinculado ao restaurante.");
      setEmail("");
    } else {
      toast.error(res.error ?? "Erro ao vincular.");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{restaurant.name}</p>
              <Badge variant={STATUS_VARIANT[restaurant.status]}>
                {restaurant.status}
              </Badge>
              {restaurant.onboarding_status === "in_review" && (
                <Badge variant="outline">onboarding</Badge>
              )}
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
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="E-mail do dono para vincular"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={assigning || !email.trim()}
            onClick={assignOwner}
          >
            {assigning ? "Vinculando..." : "Vincular dono"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
