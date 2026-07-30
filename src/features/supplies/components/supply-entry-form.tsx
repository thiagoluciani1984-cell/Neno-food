"use client";

import { useState, useMemo } from "react";
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
import { formatBRL, reaisToCents, centsToReais } from "@/lib/money";
import { createSupplyEntryAction } from "@/features/supplies/actions";
import { UNIT_TYPE_LABELS } from "@/features/supplies/schemas";
import type { SupplyItem, SupplyUnitType } from "@/types/database.types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SupplyEntryForm({ items }: { items: SupplyItem[] }) {
  const activeItems = items.filter((i) => i.is_active);

  const [itemId, setItemId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [takenAt, setTakenAt] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedItem = useMemo(
    () => activeItems.find((i) => i.id === itemId) ?? null,
    [activeItems, itemId]
  );

  function handleSelectItem(id: string) {
    setItemId(id);
    const item = activeItems.find((i) => i.id === id);
    if (item) setPrice(centsToReais(item.default_price_cents).toFixed(2).replace(".", ","));
  }

  const quantityNum = Number(quantity.replace(",", "."));
  const totalCents =
    !Number.isNaN(quantityNum) && quantityNum > 0 ? Math.round(quantityNum * reaisToCents(price)) : 0;

  async function handleSubmit() {
    if (!selectedItem) {
      toast.error("Escolha um item do catálogo.");
      return;
    }
    if (!quantityNum || quantityNum <= 0) {
      toast.error("Informe a quantidade.");
      return;
    }
    setSaving(true);
    const res = await createSupplyEntryAction({
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      unit_type: selectedItem.unit_type,
      quantity: quantityNum,
      unit_price_cents: reaisToCents(price),
      taken_at: takenAt,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Lançamento enviado para aprovação!");
      setItemId("");
      setQuantity("");
      setPrice("");
      setNotes("");
      setTakenAt(todayISO());
    } else {
      toast.error(res.error);
    }
  }

  if (activeItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Cadastre pelo menos um item no catálogo (aba &quot;Catálogo&quot;) antes de lançar uma retirada.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançar item retirado</CardTitle>
        <CardDescription>
          Fica pendente até a aprovação — só depois disso entra no relatório.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Item</Label>
          <Select value={itemId} onValueChange={handleSelectItem}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o item" />
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
          <Label>Quantidade {selectedItem ? `(${UNIT_TYPE_LABELS[selectedItem.unit_type]})` : ""}</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={selectedItem?.unit_type === "kg" ? "Ex: 2,5" : "Ex: 1"}
          />
        </div>

        <div className="space-y-2">
          <Label>Data que pegou</Label>
          <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Preço unitário (R$)</Label>
          <Input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Total</Label>
          <p className="flex h-10 items-center text-lg font-bold text-primary">{formatBRL(totalCents)}</p>
        </div>

        <div className="space-y-2 sm:col-span-4">
          <Label>Observação (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: pego pela manhã" />
        </div>

        <div className="sm:col-span-4">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Lançar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
