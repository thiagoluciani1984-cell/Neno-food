"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient, getRealtimeAuthReady } from "@/infra/supabase/client";
import { formatBRL } from "@/lib/money";
import { UNIT_TYPE_LABELS, MOVEMENT_REASON_LABELS } from "@/features/stock/schemas";
import { createStockMovementAction } from "@/features/stock/actions";
import type { StockItem, StockMovement, StockMovementReason } from "@/types/database.types";

const MANUAL_REASONS = ["purchase", "loss", "adjustment"] as const satisfies readonly StockMovementReason[];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function StockMovementsList({
  restaurantId,
  items,
  initialMovements,
}: {
  restaurantId: string;
  items: StockItem[];
  initialMovements: StockMovement[];
}) {
  const [movements, setMovements] = useState(initialMovements);
  const [stockItemId, setStockItemId] = useState("");
  const [type, setType] = useState<"in" | "out">("in");
  const [reason, setReason] = useState<(typeof MANUAL_REASONS)[number]>("purchase");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const activeItems = items.filter((i) => i.is_active);
  const itemsById = new Map(items.map((i) => [i.id, i]));

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void getRealtimeAuthReady().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`stock-movements-${restaurantId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "stock_movements", filter: `restaurant_id=eq.${restaurantId}` },
          (payload) => {
            setMovements((prev) => [payload.new as StockMovement, ...prev]);
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  async function handleSubmit() {
    const qty = Number(quantity.replace(",", "."));
    if (!stockItemId) {
      toast.error("Escolha o insumo.");
      return;
    }
    if (!qty || qty <= 0) {
      toast.error("Informe a quantidade.");
      return;
    }
    setSaving(true);
    const res = await createStockMovementAction({
      stock_item_id: stockItemId,
      type,
      reason,
      quantity: qty,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Movimentação registrada!");
      setQuantity("");
      setNotes("");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Registrar entrada/saída manual</CardTitle>
          <CardDescription>
            Compra de fornecedor, perda/quebra/vencimento, ou ajuste de contagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Insumo</Label>
            <Select value={stockItemId} onValueChange={setStockItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o insumo" />
              </SelectTrigger>
              <SelectContent>
                {activeItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as "in" | "out")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada</SelectItem>
                <SelectItem value="out">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as (typeof MANUAL_REASONS)[number])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {MOVEMENT_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>
              Quantidade{" "}
              {stockItemId ? `(${UNIT_TYPE_LABELS[itemsById.get(stockItemId)?.unit_type ?? "un"]})` : ""}
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Observação {reason !== "purchase" ? "(recomendado)" : "(opcional)"}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex items-end sm:col-span-4">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Registrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {movements.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
          )}
          {movements.map((m) => {
            const item = itemsById.get(m.stock_item_id);
            return (
              <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item?.name ?? "—"}</p>
                    <Badge variant={m.type === "in" ? "success" : "outline"}>
                      {m.type === "in" ? "Entrada" : "Saída"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.quantity} {item ? UNIT_TYPE_LABELS[item.unit_type] : ""} ·{" "}
                    {MOVEMENT_REASON_LABELS[m.reason]} · {formatDateTime(m.created_at)}
                    {m.notes ? ` · ${m.notes}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium">{formatBRL(m.total_cost_cents)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
