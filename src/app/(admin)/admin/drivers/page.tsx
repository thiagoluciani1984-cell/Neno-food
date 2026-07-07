import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { listDriversForAdmin } from "@/features/admin/queries";
import { DriverRow } from "@/features/admin/components/driver-row";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Entregadores | Admin" };

export default async function AdminDriversPage() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login?redirect=/admin/drivers");
  if (profile?.role !== "master_admin") redirect("/");

  const drivers = await listDriversForAdmin();
  const pending = drivers.filter((d) => d.approval_status === "pending");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="font-semibold">Entregadores</h1>
        </div>
        <BadgeCount pending={pending.length} total={drivers.length} />
      </header>

      <main className="container max-w-4xl space-y-4 py-8">
        {pending.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Aguardando aprovação ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((d) => (
                <DriverRow key={d.id} driver={d} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Todos os entregadores
          </h2>
          <div className="space-y-3">
            {drivers.map((d) => (
              <DriverRow key={d.id} driver={d} />
            ))}
            {drivers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum entregador cadastrado ainda.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function BadgeCount({ pending, total }: { pending: number; total: number }) {
  return (
    <span className="text-sm text-muted-foreground">
      {pending} pendente(s) · {total} total
    </span>
  );
}
