"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({
  rows,
  filename,
}: {
  rows: string[][];
  filename: string;
}) {
  function handleExport() {
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
