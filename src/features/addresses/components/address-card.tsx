"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MapPin, Star, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteAddressAction, setDefaultAddressAction } from "../actions";
import { AddressForm } from "./address-form";
import type { Address } from "../queries";

interface AddressCardProps {
  address: Address;
}

export function AddressCard({ address }: AddressCardProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Remover este endereço?")) return;
    startTransition(async () => {
      const result = await deleteAddressAction(address.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Endereço removido.");
    });
  }

  function handleSetDefault() {
    startTransition(async () => {
      const result = await setDefaultAddressAction(address.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Endereço padrão atualizado.");
    });
  }

  const fullAddress = [
    `${address.street}, ${address.number}`,
    address.complement,
    address.district,
    `${address.city} - ${address.state}`,
    address.zip.replace(/(\d{5})(\d{3})/, "$1-$2"),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-colors",
        address.is_default ? "border-primary/40 bg-primary/5" : "bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", address.is_default ? "text-primary" : "text-muted-foreground")} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold leading-tight">{address.label}</p>
              {address.is_default && (
                <Badge variant="outline" className="border-primary/30 text-primary text-[10px] px-1.5 py-0">
                  Padrão
                </Badge>
              )}
            </div>
            {address.recipient && (
              <p className="text-xs text-muted-foreground">{address.recipient}</p>
            )}
            <p className="mt-0.5 text-sm text-foreground/80">{fullAddress}</p>
            {address.reference && (
              <p className="mt-0.5 text-xs text-muted-foreground">{address.reference}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          {!address.is_default && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={handleSetDefault}
              disabled={pending}
              title="Definir como padrão"
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          )}
          <AddressForm
            existing={address}
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
