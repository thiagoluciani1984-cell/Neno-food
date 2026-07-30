"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { formatBRL, reaisToCents, centsToReais } from "@/lib/money";
import { saveSupplyItemAction, deactivateSupplyItemAction } from "@/features/supplies/actions";
import { UNIT_TYPE_LABELS } from "@/features/supplies/schemas";
import type { SupplyItem, SupplyUnitType } from "@/types/database.types";

const EMPTY_FORM = { id: undefined as string | undefined, name: "", unit_type: "kg" as SupplyUnitType, price: "" };

export function SupplyItemManager({ items }: { items: SupplyItem[] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const activeItems = items.filter((i) => i.is_active);

  function startEdit(item: SupplyItem) {
    setForm({
      id: item.id,
      name: item.name,
      unit_type: item.unit_type,
      price: centsToReais(item.default_price_cents).toFixed(2).replace(".", ","),
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    setSaving(true);
    const res = await saveSupplyItemAction({
      id: form.id,
      name: form.name.trim(),
      unit_type: form.unit_type,
      default_price_cents: reaisToCents(form.price),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Item salvo!");
      setForm(EMPTY_FORM);
    } else {
      toast.error(res.error);
    }
  }

  async function handleDeactivate(itemId: string) {
    const res = await deactivateSupplyItemAction(itemId);
    if (res.ok) {
      toast.success("Item removido do catálogo.");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Editar item" : "Novo item do catálogo"}</CardTitle>
          <CardDescription>
            Ex.: &quot;Queijo Coalho (barra)&quot; por unidade, &quot;Farinha de trigo&quot; por kg.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome do item</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Queijo Coalho (barra)"
            />
          </div>
          <div className="space-y-2">
            <Label>Cobrado por</Label>
            <Select
              value={form.unit_type}
              onValueChange={(v) => setForm((f) => ({ ...f, unit_type: v as SupplyUnitType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">{UNIT_TYPE_LABELS.kg}</SelectItem>
                <SelectItem value="unit">{UNIT_TYPE_LABELS.unit}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Preço (R$ por {form.unit_type === "kg" ? "kg" : "unidade"})</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0,00"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {form.id ? "Salvar alterações" : "Adicionar item"}
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
          <CardTitle>Itens cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeItems.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum item cadastrado ainda.</p>
          )}
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBRL(item.default_price_cents)} / {UNIT_TYPE_LABELS[item.unit_type]}
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
