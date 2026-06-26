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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { saveCategoryAction } from "@/features/catalog/actions";
import type { Category } from "@/types/database.types";

export function CategoryDialog({
  category,
  trigger,
}: {
  category?: Category;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);

  async function onSubmit() {
    setSaving(true);
    const res = await saveCategoryAction({
      id: category?.id,
      name,
      description,
      sortOrder,
      isActive,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Categoria salva.");
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
          <DialogTitle>
            {category ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ordem de exibição</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Categoria ativa</Label>
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
