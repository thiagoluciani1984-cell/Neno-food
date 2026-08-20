import type { SupplyEntry } from "@/types/database.types";

export function isSupplyEntryVisibleInList(entry: Pick<SupplyEntry, "status" | "paid_at">): boolean {
  return entry.status === "pending" || (entry.status === "approved" && !entry.paid_at);
}

export function getSupplyReportEntries(entries: SupplyEntry[]): SupplyEntry[] {
  return entries.filter((entry) => entry.status === "approved");
}
