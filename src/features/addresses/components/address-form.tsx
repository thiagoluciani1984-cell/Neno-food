"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressSchema, type AddressInput } from "../schemas";
import { addAddressAction, updateAddressAction } from "../actions";
import type { Address } from "../queries";

interface AddressFormProps {
  existing?: Address;
  trigger?: React.ReactNode;
}

export function AddressForm({ existing, trigger }: AddressFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: existing
      ? {
          label: existing.label,
          recipient: existing.recipient ?? "",
          street: existing.street,
          number: existing.number,
          complement: existing.complement ?? "",
          district: existing.district,
          city: existing.city,
          state: existing.state,
          zip: existing.zip,
          reference: existing.reference ?? "",
        }
      : { label: "Casa", state: "" },
  });

  function onSubmit(data: AddressInput) {
    startTransition(async () => {
      const result = existing
        ? await updateAddressAction(existing.id, data)
        : await addAddressAction(data);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(existing ? "Endereço atualizado!" : "Endereço salvo!");
        setOpen(false);
        if (!existing) reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo endereço
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar endereço" : "Adicionar endereço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label>Rótulo</Label>
            <Input placeholder="Casa, Trabalho…" {...register("label")} />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Destinatário (opcional)</Label>
            <Input placeholder="Nome de quem recebe" {...register("recipient")} />
          </div>

          <div className="col-span-2 space-y-1">
            <Label>CEP</Label>
            <Input placeholder="01310-100" {...register("zip")} />
            {errors.zip && <p className="text-xs text-destructive">{errors.zip.message}</p>}
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Rua</Label>
            <Input placeholder="Av. Paulista" {...register("street")} />
            {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Número</Label>
            <Input placeholder="1578" {...register("number")} />
            {errors.number && <p className="text-xs text-destructive">{errors.number.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Complemento</Label>
            <Input placeholder="Apto 42" {...register("complement")} />
          </div>

          <div className="space-y-1">
            <Label>Bairro</Label>
            <Input placeholder="Bela Vista" {...register("district")} />
            {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>UF</Label>
            <Input placeholder="SP" maxLength={2} {...register("state")} />
            {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Cidade</Label>
            <Input placeholder="São Paulo" {...register("city")} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Referência (opcional)</Label>
            <Input placeholder="Próximo ao metrô" {...register("reference")} />
          </div>

          <Button type="submit" className="col-span-2 mt-1" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existing ? "Salvar alterações" : "Adicionar endereço"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
