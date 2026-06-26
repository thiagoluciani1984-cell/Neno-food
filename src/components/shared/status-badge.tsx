import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, RestaurantStatus, DriverStatus } from "@/types/database.types";

/* ── Pedidos ─────────────────────────────────────────────────────────── */

const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; variant: "warning" | "info" | "success" | "destructive" | "muted" | "default" }
> = {
  payment_pending:   { label: "Aguardando pagamento",  variant: "muted" },
  received:          { label: "Recebido",              variant: "info" },
  confirmed:         { label: "Confirmado",            variant: "info" },
  preparing:         { label: "Em preparo",            variant: "warning" },
  ready:             { label: "Pronto",                variant: "success" },
  out_for_delivery:  { label: "A caminho",             variant: "default" },
  delivered:         { label: "Entregue",              variant: "success" },
  cancelled:         { label: "Cancelado",             variant: "destructive" },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { label, variant } = ORDER_STATUS_MAP[status] ?? {
    label: status,
    variant: "muted" as const,
  };
  return (
    <Badge variant={variant} className={cn("shrink-0", className)}>
      {label}
    </Badge>
  );
}

/* ── Restaurante ─────────────────────────────────────────────────────── */

const RESTAURANT_STATUS_MAP: Record<
  RestaurantStatus,
  { label: string; variant: "warning" | "success" | "destructive" | "muted" }
> = {
  pending: { label: "Aguardando análise", variant: "warning" },
  active:  { label: "Ativo",              variant: "success" },
  blocked: { label: "Bloqueado",          variant: "destructive" },
};

export function RestaurantStatusBadge({
  status,
  className,
}: {
  status: RestaurantStatus;
  className?: string;
}) {
  const { label, variant } = RESTAURANT_STATUS_MAP[status] ?? {
    label: status,
    variant: "muted" as const,
  };
  return (
    <Badge variant={variant} className={cn("shrink-0", className)}>
      {label}
    </Badge>
  );
}

/* ── Entregador ──────────────────────────────────────────────────────── */

const DRIVER_STATUS_MAP: Record<
  DriverStatus,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  available: { label: "Disponível", variant: "success" },
  busy:      { label: "Em entrega", variant: "warning" },
  offline:   { label: "Offline",    variant: "muted" },
};

export function DriverStatusBadge({
  status,
  className,
}: {
  status: DriverStatus;
  className?: string;
}) {
  const { label, variant } = DRIVER_STATUS_MAP[status] ?? {
    label: status,
    variant: "muted" as const,
  };
  return (
    <Badge variant={variant} className={cn("shrink-0", className)}>
      {label}
    </Badge>
  );
}

/* ── Restaurante aberto/fechado ──────────────────────────────────────── */

export function OpenClosedBadge({
  isOpen,
  className,
}: {
  isOpen: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant={isOpen ? "success" : "muted"}
      className={cn("gap-1.5 shrink-0", className)}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-white" : "bg-muted-foreground"}`}
      />
      {isOpen ? "Aberto" : "Fechado"}
    </Badge>
  );
}
