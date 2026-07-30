"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
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
import { saveStockRecipeAction, deleteStockRecipeAction } from "@/features/stock/actions";
import { UNIT_TYPE_LABELS } from "@/features/stock/schemas";
import type { StockItem, StockUnitType } from "@/types/database.types";
import type { StockRecipeWithNames } from "@/features/stock/queries";

export function StockRecipeEditor({
  items,
  products,
  recipes,
}: {
  items: StockItem[];
  products: { id: string; name: string }[];
  recipes: StockRecipeWithNames[];
}) {
  const [productId, setProductId] = useState("");
  const [stockItemId, setStockItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const activeItems = items.filter((i) => i.is_active);

  async function handleAdd() {
    const qty = Number(quantity.replace(",", "."));
    if (!productId || !stockItemId) {
      toast.error("Escolha o produto e o insumo.");
      return;
    }
    if (!qty || qty <= 0) {
      toast.error("Informe a quantidade consumida.");
      return;
    }
    setSaving(true);
    const res = await saveStockRecipeAction({
      product_id: productId,
      stock_item_id: stockItemId,
      quantity_per_unit: qty,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Ficha técnica salva!");
      setQuantity("");
    } else {
      toast.error(res.error);
    }
  }

  async function handleDelete(recipeId: string) {
    const res = await deleteStockRecipeAction(recipeId);
    if (res.ok) toast.success("Removido da ficha técnica.");
    else toast.error(res.error);
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Cadastre produtos no cardápio antes de montar a ficha técnica.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ficha técnica</CardTitle>
          <CardDescription>
            Vincule quanto de cada insumo um item do cardápio consome. Opcional — sem ficha, o item
            não baixa estoque sozinho.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Produto do cardápio</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Insumo</Label>
            <Select value={stockItemId} onValueChange={setStockItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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
            <Label>
              Quantidade{" "}
              {stockItemId
                ? `(${UNIT_TYPE_LABELS[(activeItems.find((i) => i.id === stockItemId)?.unit_type ?? "un") as StockUnitType]})`
                : ""}
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 0,3"
            />
          </div>
          <div className="sm:col-span-4">
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vínculos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recipes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma ficha técnica cadastrada ainda.</p>
          )}
          {recipes.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <p>
                <span className="font-medium">{r.product_name}</span> consome{" "}
                <span className="font-medium">
                  {r.quantity_per_unit} {UNIT_TYPE_LABELS[r.stock_item_unit_type as StockUnitType]}
                </span>{" "}
                de {r.stock_item_name}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(r.id)}
                aria-label="Remover"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
