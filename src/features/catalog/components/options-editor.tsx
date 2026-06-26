"use client";

import { useState, useTransition } from "react";
import { fetchProductOptionsAction } from "../actions-options-fetch";
import { toast } from "sonner";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Loader2,
  ListChecks, ToggleLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { centsToReais, reaisToCents } from "@/lib/money";
import {
  saveOptionGroupAction,
  deleteOptionGroupAction,
  saveOptionItemAction,
  deleteOptionItemAction,
} from "../actions-options";
import type { OptionGroupWithItems } from "../queries-options";
import type { ProductOptionItem } from "@/types/database.types";

/* ── Formulário de item ─────────────────────────────────────────────── */
function ItemForm({
  optionId,
  productId,
  item,
  onDone,
}: {
  optionId: string;
  productId: string;
  item?: ProductOptionItem;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveOptionItemAction(productId, optionId, item?.id ?? null, fd);
      if (res.ok) { toast.success(item ? "Item atualizado." : "Item adicionado."); onDone(); }
      else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl bg-muted/40 p-3">
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Nome</Label>
        <Input name="name" defaultValue={item?.name} placeholder="Ex: Queijo extra" required className="h-8 text-sm" />
      </div>
      <div className="w-28 space-y-1">
        <Label className="text-xs">Preço (R$)</Label>
        <Input
          name="price_cents"
          type="number"
          step="0.01"
          min="0"
          defaultValue={item ? centsToReais(item.price_cents).toFixed(2) : "0.00"}
          className="h-8 text-sm"
          onChange={(e) => {
            const input = e.currentTarget;
            input.dataset.cents = String(reaisToCents(parseFloat(input.value) || 0));
          }}
          onBlur={(e) => {
            const fd = new FormData();
            fd.set("price_cents", String(reaisToCents(parseFloat(e.target.value) || 0)));
          }}
        />
      </div>
      <Button type="submit" size="sm" className="h-8" disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (item ? "Salvar" : "Adicionar")}
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-8" onClick={onDone}>Cancelar</Button>
    </form>
  );
}

/* ── Formulário de grupo ─────────────────────────────────────────────── */
function GroupForm({
  productId,
  group,
  onDone,
}: {
  productId: string;
  group?: OptionGroupWithItems;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<"single" | "multiple">(group?.type ?? "single");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveOptionGroupAction(productId, group?.id ?? null, fd);
      if (res.ok) { toast.success(group ? "Grupo atualizado." : "Grupo criado."); onDone(); }
      else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gname">Nome do grupo *</Label>
          <Input id="gname" name="name" defaultValue={group?.name} placeholder="Ex: Tamanho, Borda, Extras" required />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de seleção</Label>
          <div className="flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="type" value="single" defaultChecked={type === "single"} className="accent-primary" onChange={() => setType("single")} />
              <ToggleLeft className="h-3.5 w-3.5" /> Único
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="type" value="multiple" defaultChecked={type === "multiple"} className="accent-primary" onChange={() => setType("multiple")} />
              <ListChecks className="h-3.5 w-3.5" /> Múltiplo
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="is_required" value="true" defaultChecked={group?.is_required} className="accent-primary" />
          Obrigatório
        </label>
        {type === "multiple" && (
          <div className="flex items-center gap-2 text-sm">
            <span>Mín:</span>
            <Input name="min_qty" type="number" min="0" defaultValue={group?.min_qty ?? 0} className="h-7 w-16 text-sm" />
            <span>Máx:</span>
            <Input name="max_qty" type="number" min="1" defaultValue={group?.max_qty ?? 3} className="h-7 w-16 text-sm" />
          </div>
        )}
        {type === "single" && (
          <>
            <input type="hidden" name="min_qty" value="0" />
            <input type="hidden" name="max_qty" value="1" />
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (group ? "Salvar" : "Criar grupo")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

/* ── Grupo com seus itens ───────────────────────────────────────────── */
function OptionGroup({
  group,
  productId,
  onRefresh,
}: {
  group: OptionGroupWithItems;
  productId: string;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [deleting, startDelete] = useTransition();

  function handleDeleteGroup() {
    if (!confirm(`Remover grupo "${group.name}" e todos os seus itens?`)) return;
    startDelete(async () => {
      const res = await deleteOptionGroupAction(productId, group.id);
      if (res.ok) { toast.success("Grupo removido."); onRefresh(); }
      else toast.error(res.error);
    });
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header do grupo */}
      <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <span className="font-semibold text-sm">{group.name}</span>
          <Badge variant={group.type === "single" ? "info" : "warning"} className="text-[10px] px-1.5">
            {group.type === "single" ? "Único" : "Múltiplo"}
          </Badge>
          {group.is_required && <Badge variant="destructive" className="text-[10px] px-1.5">Obrigatório</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingGroup(true)}>
            Editar
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" disabled={deleting} onClick={handleDeleteGroup}>
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {editingGroup && (
        <div className="p-3 border-t">
          <GroupForm productId={productId} group={group} onDone={() => { setEditingGroup(false); onRefresh(); }} />
        </div>
      )}

      {expanded && (
        <div className="divide-y">
          {group.product_option_items.map((item) => (
            <OptionItemRow key={item.id} item={item} productId={productId} optionId={group.id} onRefresh={onRefresh} />
          ))}

          <div className="px-4 py-2">
            {addingItem ? (
              <ItemForm
                optionId={group.id}
                productId={productId}
                onDone={() => { setAddingItem(false); onRefresh(); }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingItem(true)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionItemRow({
  item,
  productId,
  optionId,
  onRefresh,
}: {
  item: ProductOptionItem;
  productId: string;
  optionId: string;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteOptionItemAction(productId, item.id);
      if (res.ok) { toast.success("Item removido."); onRefresh(); }
      else toast.error(res.error);
    });
  }

  if (editing) {
    return (
      <div className="px-4 py-2">
        <ItemForm
          optionId={optionId}
          productId={productId}
          item={item}
          onDone={() => { setEditing(false); onRefresh(); }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-sm">{item.name}</span>
        {item.price_cents > 0 && (
          <span className="text-xs font-medium text-primary">
            +R$ {centsToReais(item.price_cents).toFixed(2).replace(".", ",")}
          </span>
        )}
        {item.price_cents === 0 && (
          <span className="text-xs text-muted-foreground">Incluso</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditing(true)}>Editar</Button>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" disabled={deleting} onClick={handleDelete}>
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

/* ── Editor principal ────────────────────────────────────────────────── */
export function OptionsEditor({
  productId,
  initialGroups,
}: {
  productId: string;
  initialGroups: OptionGroupWithItems[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [addingGroup, setAddingGroup] = useState(false);
  const [loading, setLoading] = useState(false);

  function refresh() {
    setLoading(true);
    fetchProductOptionsAction(productId).then((data) => {
      setGroups(data);
      setLoading(false);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Complementos, tamanhos e adicionais. O cliente verá essas opções ao adicionar o produto ao carrinho.
      </p>

      <div className="space-y-2">
        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && groups.map((g) => (
          <OptionGroup key={g.id} group={g} productId={productId} onRefresh={refresh} />
        ))}
      </div>

      {addingGroup ? (
        <GroupForm
          productId={productId}
          onDone={() => { setAddingGroup(false); refresh(); }}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setAddingGroup(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo grupo de opções
        </Button>
      )}

      {!loading && groups.length === 0 && !addingGroup && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Nenhum complemento cadastrado. Clique acima para adicionar.
        </p>
      )}
    </div>
  );
}
