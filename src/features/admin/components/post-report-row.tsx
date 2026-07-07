"use client";

import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resolvePostReportAction } from "@/features/admin/actions";
import type { PostReportRow } from "@/features/admin/queries";

export function PostReportRow({ report }: { report: PostReportRow }) {
  async function resolve(action: "dismiss" | "remove_post") {
    const res = await resolvePostReportAction(report.id, action);
    toast[res.ok ? "success" : "error"](
      res.ok
        ? action === "remove_post"
          ? "Post removido."
          : "Denúncia arquivada."
        : res.error ?? "Erro."
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              <Badge variant="outline">{report.reason}</Badge>
            </div>
            <p className="mt-1 text-sm font-medium">
              {report.post?.restaurant?.name ?? "Post removido"}
            </p>
            {report.post?.caption && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {report.post.caption}
              </p>
            )}
            {report.detail && (
              <p className="mt-1 text-xs text-muted-foreground">{report.detail}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Por {report.reporter?.full_name ?? report.reporter?.email ?? "—"} ·{" "}
              {new Date(report.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => resolve("dismiss")}>
              Arquivar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => resolve("remove_post")}
            >
              Remover post
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
