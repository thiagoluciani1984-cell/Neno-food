import type { Metadata } from "next";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Clientes" };

interface CustomerRow {
  name: string;
  phone: string;
  orders: number;
  spent: number;
  last: string;
}

export default async function CustomersPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("customer_name, customer_phone, total_cents, created_at, status")
    .eq("restaurant_id", restaurantId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  // Agrega por telefone (identificador prático do cliente no balcão)
  const map = new Map<string, CustomerRow>();
  for (const o of data ?? []) {
    const key = o.customer_phone ?? o.customer_name ?? "—";
    const existing = map.get(key);
    if (existing) {
      existing.orders += 1;
      existing.spent += o.total_cents;
    } else {
      map.set(key, {
        name: o.customer_name ?? "Cliente",
        phone: o.customer_phone ?? "—",
        orders: 1,
        spent: o.total_cents,
        last: o.created_at,
      });
    }
  }
  const customers = [...map.values()].sort((a, b) => b.spent - a.spent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Quem já pediu no seu restaurante.
        </p>
      </div>

      <div className="grid gap-3">
        {customers.map((c) => (
          <Card key={c.phone + c.name}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.phone}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{c.orders} pedidos</Badge>
                <span className="font-semibold">{formatBRL(c.spent)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum cliente ainda.
          </p>
        )}
      </div>
    </div>
  );
}
