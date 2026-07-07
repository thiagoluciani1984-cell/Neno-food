"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setDriverApprovalAction } from "@/features/admin/actions";
import type { AdminDriverRow } from "@/features/admin/queries";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

export function DriverRow({ driver }: { driver: AdminDriverRow }) {
  const name = driver.profiles?.full_name ?? "Sem nome";
  const email = driver.profiles?.email ?? "—";
  const docsCount = driver.driver_documents.length;
  const pendingDocs = driver.driver_documents.filter(
    (d) => d.status === "pending"
  ).length;

  async function approve() {
    const res = await setDriverApprovalAction(driver.id, "approved");
    toast[res.ok ? "success" : "error"](
      res.ok ? "Entregador aprovado." : res.error ?? "Erro."
    );
  }

  async function reject() {
    const res = await setDriverApprovalAction(driver.id, "rejected");
    toast[res.ok ? "success" : "error"](
      res.ok ? "Cadastro rejeitado." : res.error ?? "Erro."
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{name}</p>
            <Badge variant={STATUS_VARIANT[driver.approval_status] ?? "outline"}>
              {driver.approval_status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {driver.vehicle_type ?? "veículo"} · {driver.vehicle_plate ?? "—"} ·{" "}
            {docsCount} doc(s){pendingDocs > 0 ? ` · ${pendingDocs} pendente(s)` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {driver.approval_status !== "approved" && (
            <Button size="sm" onClick={approve}>
              Aprovar
            </Button>
          )}
          {driver.approval_status !== "rejected" && (
            <Button size="sm" variant="outline" onClick={reject}>
              Rejeitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
