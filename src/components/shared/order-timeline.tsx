import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database.types";

const STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "received",         label: "Pedido recebido",        description: "Aguardando o restaurante" },
  { status: "confirmed",        label: "Confirmado",              description: "Restaurante aceitou seu pedido" },
  { status: "preparing",        label: "Em preparo",              description: "Seu pedido está sendo preparado" },
  { status: "ready",            label: "Pronto",                  description: "Pedido pronto para saída" },
  { status: "out_for_delivery", label: "A caminho",               description: "Entregador a caminho" },
  { status: "delivered",        label: "Entregue",                description: "Pedido entregue com sucesso" },
];

const STATUS_INDEX: Partial<Record<OrderStatus, number>> = Object.fromEntries(
  STEPS.map((s, i) => [s.status, i])
);

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  timestamps?: Partial<Record<string, string>>;
  className?: string;
  compact?: boolean;
}

export function OrderTimeline({
  currentStatus,
  timestamps,
  className,
  compact = false,
}: OrderTimelineProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl bg-destructive/10 p-4", className)}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive">
          <span className="text-xs font-bold text-white">✕</span>
        </div>
        <div>
          <p className="font-semibold text-destructive">Pedido cancelado</p>
          {timestamps?.cancelled_at && (
            <p className="text-xs text-muted-foreground">
              {new Date(timestamps.cancelled_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_INDEX[currentStatus] ?? 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-0", className)}>
        {STEPS.map((step, idx) => {
          const done    = idx < currentIdx;
          const current = idx === currentIdx;
          return (
            <div key={step.status} className="flex items-center">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                  done    ? "bg-primary text-white" :
                  current ? "bg-primary/20 text-primary ring-2 ring-primary" :
                            "bg-muted text-muted-foreground"
                )}
                title={step.label}
              >
                {done ? <Check className="h-3 w-3" /> : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8 transition-colors", idx < currentIdx ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ol className={cn("space-y-0", className)}>
      {STEPS.map((step, idx) => {
        const done    = idx < currentIdx;
        const current = idx === currentIdx;
        const future  = idx > currentIdx;
        const isLast  = idx === STEPS.length - 1;

        return (
          <li key={step.status} className="flex gap-4">
            {/* Ícone + linha vertical */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  done    ? "bg-primary text-white" :
                  current ? "bg-primary/15 text-primary ring-2 ring-primary ring-offset-2" :
                            "bg-muted text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : current ? (
                  <Clock className="h-4 w-4 animate-pulse" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              {!isLast && (
                <div className={cn("mt-1 w-0.5 flex-1 min-h-6", done ? "bg-primary" : "bg-muted")} />
              )}
            </div>

            {/* Conteúdo */}
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  future ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </p>
              {!future && (
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
