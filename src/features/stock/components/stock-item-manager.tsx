"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, reaisToCents, centsToReais } from "@/lib/money";
import { saveStockItemAction, deactivateStockItemAction } from "@/features/stock/actions";
import { UNIT_TYPE_LABELS } from "@/features/stock/schemas";
import type { StockItem, StockUnitType } from "@/types/database.types";

const EMPTY_FORM = {
  id: undefined as string | undefined,
  name: "",
  unit_type: "kg" as StockUnitType,
  minQuantity: "0",
  price: "",
};

export function StockItemManager({ items }: { items: StockItem[] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const activeItems = items.filter((i) => i.is_active);

  function startEdit(item: StockItem) {
    setForm({
      id: item.id,
      name: item.name,
      unit_type: item.unit_type,
      minQuantity: String(item.min_quantity),
      price: centsToReais(item.unit_cost_cents).toFixed(2).replace(".", ","),
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do insumo.");
      return;
    }
    setSaving(true);
    const res = await saveStockItemAction({
      id: form.id,
      name: form.name.trim(),
      unit_type: form.unit_type,
      min_quantity: Number(form.minQuantity.replace(",", ".")) || 0,
      unit_cost_cents: reaisToCents(form.price),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Insumo salvo!");
      setForm(EMPTY_FORM);
    } else {
      toast.error(res.error);
    }
  }

  async function handleDeactivate(itemId: string) {
    const res = await deactivateStockItemAction(itemId);
    if (res.ok) toast.success("Insumo removido do catálogo.");
    else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Editar insumo" : "Novo insumo"}</CardTitle>
          <CardDescription>
            Ex.: &quot;Queijo mussarela&quot; em kg, &quot;Molho de tomate&quot; em kg, &quot;Massa de pizza&quot; em unidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome do insumo</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Queijo mussarela"
            />
          </div>
          <div className="space-y-2">
            <Label>Unidade</Label>
            <Select
              value={form.unit_type}
              onValueChange={(v) => setForm((f) => ({ ...f, unit_type: v as StockUnitType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estoque mínimo</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={form.minQuantity}
              onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Custo (R$ por {UNIT_TYPE_LABELS[form.unit_type]})</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0,00"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {form.id ? "Salvar alterações" : "Adicionar insumo"}
            </Button>
            {form.id && (
              <Button variant="ghost" onClick={() => setForm(EMPTY_FORM)}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insumos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeItems.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum insumo cadastrado ainda.</p>
          )}
          {activeItems.map((item) => {
            const low = item.current_quantity < item.min_quantity;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {low && (
                      <Badge variant="warning" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Estoque baixo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.current_quantity} {UNIT_TYPE_LABELS[item.unit_type]} em estoque · mínimo{" "}
                    {item.min_quantity} · {formatBRL(item.unit_cost_cents)}/{UNIT_TYPE_LABELS[item.unit_type]}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeactivate(item.id)}
                    aria-label="Remover"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
