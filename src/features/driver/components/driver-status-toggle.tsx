"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateDriverStatusAction } from "../actions";

interface DriverStatusToggleProps {
  currentStatus: "offline" | "available" | "busy";
  approvalStatus: string;
}

export function DriverStatusToggle({
  currentStatus,
  approvalStatus,
}: DriverStatusToggleProps) {
  const [status, setStatus] = useState(currentStatus);
  const [pending, startTransition] = useTransition();

  const isOnline = status === "available" || status === "busy";
  const isBusy = status === "busy";
  const isApproved = approvalStatus === "approved";

  function handleToggle() {
    if (!isApproved) {
      toast.error("Sua conta ainda não foi aprovada pelo administrador.");
      return;
    }
    if (isBusy) {
      toast.info("Você está em uma entrega. Finalize antes de ficar offline.");
      return;
    }
    const next: "online" | "offline" = isOnline ? "offline" : "online";
    startTransition(async () => {
      const result = await updateDriverStatusAction(next);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setStatus(next === "online" ? "available" : "offline");
        toast.success(next === "online" ? "Você está online!" : "Você está offline.");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border p-5 transition-colors",
        isOnline ? "border-green-200 bg-green-50" : "border-muted bg-white"
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <Radio
            className={cn(
              "h-4 w-4",
              isBusy
                ? "text-orange-500"
                : isOnline
                  ? "text-green-500"
                  : "text-muted-foreground"
            )}
          />
          <span className="font-semibold">
            {isBusy ? "Em entrega" : isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isBusy
            ? "Finalize o pedido atual para ficar disponível novamente"
            : isOnline
              ? "Você está disponível para receber pedidos"
              : "Fique online para receber pedidos"}
        </p>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={pending || isBusy || !isApproved}
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none",
          isOnline ? "bg-green-500" : "bg-muted-foreground/30",
          (isBusy || !isApproved) && "cursor-not-allowed opacity-50"
        )}
      >
        {pending ? (
          <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
        ) : (
          <span
            className={cn(
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
              isOnline ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        )}
      </button>
    </div>
  );
}
