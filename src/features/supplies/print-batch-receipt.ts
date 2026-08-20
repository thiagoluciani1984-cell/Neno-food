import { ReceiptBuilder } from "@/lib/printer/escpos";
import { formatBRL } from "@/lib/money";
import { UNIT_TYPE_LABELS } from "@/features/supplies/schemas";
import type { SupplyEntry } from "@/types/database.types";

export type SupplyBatchPrintable = {
  key: string;
  label: string;
  isOpen: boolean;
  entries: SupplyEntry[];
  totalCents: number;
};

function formatReceiptMoney(cents: number): string {
  return formatBRL(cents).replace(/[  ]/g, " ");
}

function formatEntryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR");
}

function formatEntrySummary(entry: SupplyEntry): string {
  const unitLabel = UNIT_TYPE_LABELS[entry.unit_type];
  return `${entry.item_name} (${entry.quantity} ${unitLabel} · pego em ${formatEntryDate(entry.taken_at)})`;
}

export function getSupplyBatchReceiptLines(batch: SupplyBatchPrintable, restaurantName: string): string[] {
  const lines = [restaurantName, "RELATORIO DE INSUMOS", batch.label, "", "ITENS:"];

  batch.entries.forEach((entry) => {
    lines.push(formatEntrySummary(entry));
    lines.push(formatReceiptMoney(entry.total_cents));
    if (entry.notes) lines.push(`Obs: ${entry.notes}`);
  });

  lines.push("", `TOTAL DO LOTE: ${formatReceiptMoney(batch.totalCents)}`);
  return lines;
}

export function buildSupplyBatchReceipt(batch: SupplyBatchPrintable, restaurantName: string): Uint8Array {
  const receipt = new ReceiptBuilder().init();
  receipt.align("center").bold(true).doubleSize(true).text(restaurantName);
  receipt.doubleSize(false).bold(false);
  receipt.text("RELATORIO DE INSUMOS");
  receipt.text(batch.label);
  receipt.divider();

  receipt.align("left");
  receipt.bold(true).text("ITENS").bold(false);
  batch.entries.forEach((entry) => {
    receipt.text(formatEntrySummary(entry));
    receipt.align("right").text(formatReceiptMoney(entry.total_cents)).align("left");
    if (entry.notes) receipt.text(`Obs: ${entry.notes}`);
  });
  receipt.divider();
  receipt.bold(true).text(`TOTAL DO LOTE: ${formatReceiptMoney(batch.totalCents)}`).bold(false);
  receipt.feed(1).align("center").text("Nenos Food");
  receipt.cut();
  return receipt.build();
}
