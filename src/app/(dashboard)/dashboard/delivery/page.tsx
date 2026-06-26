import type { Metadata } from "next";
import { Bike } from "lucide-react";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Entregas" };

const STATUS_LABEL = {
  offline: "Offline",
  available: "Disponível",
  busy: "Em entrega",
} as const;

export default async function DeliveryPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const supabase = await createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*, profiles(full_name, phone)")
    .eq("restaurant_id", restaurantId);

  type DriverRow = {
    id: string;
    status: keyof typeof STATUS_LABEL;
    is_approved: boolean;
    total_deliveries: number;
    profiles: { full_name: string; phone: string | null } | null;
  };
  const list = (drivers ?? []) as unknown as DriverRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Entregas</h1>
        <p className="text-sm text-muted-foreground">Seus entregadores.</p>
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
                {!d.is_approved && <Badge variant="secondary">Pendente</Badge>}
                <Badge variant="outline">{STATUS_LABEL[d.status]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum entregador cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
