"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MapPin, Package, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/money";
import { completeDeliveryAction } from "../actions";
import { useDriverLocation } from "../hooks/use-driver-location";
import { DeliveryNavigateButton } from "@/features/delivery/components/delivery-tracking-card";
import type { Order, DeliveryAddressSnapshot } from "@/types/database.types";

function formatAddress(addr: DeliveryAddressSnapshot | string | null): string {
  if (!addr) return "Endereço não informado";
  if (typeof addr === "string") return addr;
  return `${addr.street}, ${addr.number}${addr.complement ? ` – ${addr.complement}` : ""}, ${addr.district}, ${addr.city}`;
}

interface ActiveOrderCardProps {
  order: Order;
}

export function ActiveOrderCard({ order }: ActiveOrderCardProps) {
  const [pending, startTransition] = useTransition();
  const [deliveryCode, setDeliveryCode] = useState("");

  useDriverLocation(order.id, order.status === "out_for_delivery");

  function handleComplete() {
    if (!deliveryCode.trim()) {
      toast.error("Informe o código PIN que o cliente mostra.");
      return;
    }
    startTransition(async () => {
      const result = await completeDeliveryAction(order.id, deliveryCode);
      if ("error" in result) toast.error(result.error);
      else toast.success("Entrega concluída! Ótimo trabalho.");
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-primary/40 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-bold text-primary">Entrega em andamento</span>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          #{order.order_number}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Entregar para</p>
            <p className="font-semibold">{order.customer_name}</p>
            <p className="text-sm text-foreground/80">
              {formatAddress(order.delivery_address)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">Total do pedido</span>
          <span className="font-bold">{formatBRL(order.total_cents)}</span>
        </div>

        <DeliveryNavigateButton deliveryAddress={order.delivery_address} />

        <div className="space-y-2">
          <Label htmlFor="delivery-code" className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Código PIN do cliente
          </Label>
          <Input
            id="delivery-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="Ex.: 4821"
            value={deliveryCode}
            onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, ""))}
          />
          <p className="text-xs text-muted-foreground">
            Peça ao cliente o código exibido na tela de acompanhamento do pedido.
          </p>
        </div>

        <Button className="w-full gap-2" onClick={handleComplete} disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Confirmar entrega
        </Button>
      </div>
    </div>
  );
}
