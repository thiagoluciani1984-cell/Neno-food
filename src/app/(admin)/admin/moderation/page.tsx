import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { listUnresolvedPostReports } from "@/features/admin/queries";
import { PostReportRow } from "@/features/admin/components/post-report-row";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Moderação | Admin" };

export default async function AdminModerationPage() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login?redirect=/admin/moderation");
  if (profile?.role !== "master_admin") redirect("/");

  const reports = await listUnresolvedPostReports();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="font-semibold">Moderação de conteúdo</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {reports.length} denúncia(s) pendente(s)
        </span>
      </header>

      <main className="container max-w-3xl space-y-4 py-8">
        {reports.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma denúncia pendente.
          </p>
        ) : (
          reports.map((r) => <PostReportRow key={r.id} report={r} />)
        )}
      </main>
    </div>
  );
}
