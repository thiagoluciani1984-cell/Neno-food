"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveCouponAction } from "@/features/coupons/actions";
import { reaisToCents, centsToReais } from "@/lib/money";
import type { Coupon, CouponType } from "@/types/database.types";

export function CouponDialog({
  coupon,
  trigger,
}: {
  coupon?: Coupon;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<CouponType>(coupon?.type ?? "percentage");
  const [valuePercent, setValuePercent] = useState(
    coupon?.value_percent?.toString() ?? "10"
  );
  const [valueReais, setValueReais] = useState(
    coupon ? centsToReais(coupon.value_cents).toString() : ""
  );
  const [minOrder, setMinOrder] = useState(
    coupon ? centsToReais(coupon.min_order_cents).toString() : ""
  );
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);

  async function onSubmit() {
    setSaving(true);
    const res = await saveCouponAction({
      id: coupon?.id,
      code,
      type,
      valuePercent: type === "percentage" ? Number(valuePercent) : null,
      valueCents: type === "fixed" ? reaisToCents(valueReais) : 0,
      minOrderCents: minOrder ? reaisToCents(minOrder) : 0,
      isActive,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Cupom salvo.");
      setOpen(false);
    } else {
      toast.error(res.error ?? "Erro ao salvar.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{coupon ? "Editar cupom" : "Novo cupom"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Código</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BEMVINDO10"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Desconto percentual</SelectItem>
                <SelectItem value="fixed">Desconto fixo</SelectItem>
                <SelectItem value="free_shipping">Frete grátis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "percentage" && (
            <div className="space-y-2">
              <Label>Percentual (%)</Label>
              <Input
                type="number"
                value={valuePercent}
                onChange={(e) => setValuePercent(e.target.value)}
              />
            </div>
          )}
          {type === "fixed" && (
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                inputMode="decimal"
                value={valueReais}
                onChange={(e) => setValueReais(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Pedido mínimo (R$)</Label>
            <Input
              inputMode="decimal"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="opcional"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
