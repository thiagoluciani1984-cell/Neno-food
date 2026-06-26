"use client";

import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouponDialog } from "./coupon-dialog";
import { deleteCouponAction } from "@/features/coupons/actions";
import { formatBRL } from "@/lib/money";
import type { Coupon } from "@/types/database.types";

const TYPE_LABEL = {
  percentage: "Percentual",
  fixed: "Valor fixo",
  free_shipping: "Frete grátis",
} as const;

export function CouponList({ coupons }: { coupons: Coupon[] }) {
  async function remove(id: string) {
    const res = await deleteCouponAction(id);
    toast[res.ok ? "success" : "error"](res.ok ? "Cupom removido." : res.error ?? "Erro.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Cupons</h1>
          <p className="text-sm text-muted-foreground">
            Crie descontos e promoções para seus clientes.
          </p>
        </div>
        <CouponDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Novo cupom
            </Button>
          }
        />
      </div>

      <div className="grid gap-3">
        {coupons.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{c.code}</span>
                  <Badge variant="outline">{TYPE_LABEL[c.type]}</Badge>
                  {!c.is_active && <Badge variant="secondary">Inativo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.type === "percentage"
                    ? `${c.value_percent}% de desconto`
                    : c.type === "fixed"
                      ? `${formatBRL(c.value_cents)} de desconto`
                      : "Frete grátis"}
                  {c.min_order_cents > 0 && ` · mínimo ${formatBRL(c.min_order_cents)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CouponDialog
                  coupon={c}
                  trigger={
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => remove(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {coupons.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum cupom cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
