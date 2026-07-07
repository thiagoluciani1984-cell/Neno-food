import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { logoutAction } from "@/features/auth/actions";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RestaurantRow } from "@/features/admin/components/restaurant-row";
import { formatBRL } from "@/lib/money";
import type { Restaurant } from "@/types/database.types";

export const metadata: Metadata = { title: "Master Admin" };

export default async function AdminPage() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login?redirect=/admin");
  if (profile?.role !== "master_admin") redirect("/");

  const supabase = await createClient();
  const [{ data: restaurants }, { data: orders }] = await Promise.all([
    supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("total_cents, status"),
  ]);

  const list = (restaurants ?? []) as Restaurant[];
  const valid = (orders ?? []).filter((o) => o.status !== "cancelled");
  const gmv = valid.reduce((s, o) => s + o.total_cents, 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <Logo />
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">
            Sair
          </Button>
        </form>
      </header>

      <main className="container max-w-4xl py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">Console da plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Métricas globais e gestão de restaurantes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Restaurantes</p>
              <p className="text-2xl font-bold">{list.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Pedidos (total)</p>
              <p className="text-2xl font-bold">{valid.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">GMV</p>
              <p className="text-2xl font-bold">{formatBRL(gmv)}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 font-serif text-xl font-bold">Restaurantes</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/drivers">Gerenciar entregadores →</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/moderation">Moderação de posts →</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {list.map((r) => (
              <RestaurantRow key={r.id} restaurant={r} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
