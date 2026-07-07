import type { Metadata } from "next";
import { Bike } from "lucide-react";
import { createClient } from "@/infra/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Entregas" };

const STATUS_LABEL = {
  offline: "Offline",
  available: "Disponível",
  busy: "Em entrega",
} as const;

const APPROVAL_LABEL = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
} as const;

export default async function DeliveryPage() {
  const supabase = await createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, status, approval_status, total_deliveries, profiles(full_name, phone)")
    .eq("approval_status", "approved")
    .order("status");

  type DriverRow = {
    id: string;
    status: keyof typeof STATUS_LABEL;
    approval_status: keyof typeof APPROVAL_LABEL;
    total_deliveries: number;
    profiles: { full_name: string; phone: string | null } | null;
  };

  const list = (drivers ?? []).map((d) => {
    const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
    return { ...d, profiles: profile } as DriverRow;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Entregadores</h1>
        <p className="text-sm text-muted-foreground">
          Entregadores aprovados na plataforma (marketplace).
        </p>
      </div>

      <div className="grid gap-3">
        {list.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Bike className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{d.profiles?.full_name ?? "Entregador"}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.profiles?.phone ?? "—"} · {d.total_deliveries} entregas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{APPROVAL_LABEL[d.approval_status]}</Badge>
                <Badge variant="outline">{STATUS_LABEL[d.status]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum entregador aprovado no momento.
          </p>
        )}
      </div>
    </div>
  );
}
