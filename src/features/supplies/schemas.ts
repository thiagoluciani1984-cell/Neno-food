import { z } from "zod";

export const supplyItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Informe o nome do item").max(120),
  unit_type: z.enum(["kg", "unit"]),
  default_price_cents: z.number().int().min(0),
});

export type SupplyItemInput = z.infer<typeof supplyItemSchema>;

export const supplyEntrySchema = z.object({
  item_id: z.string().uuid().nullable(),
  item_name: z.string().min(2, "Informe o nome do item").max(120),
  unit_type: z.enum(["kg", "unit"]),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  unit_price_cents: z.number().int().min(0),
  taken_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato AAAA-MM-DD"),
  notes: z.string().max(300).nullable().optional(),
});

export type SupplyEntryInput = z.infer<typeof supplyEntrySchema>;

export const UNIT_TYPE_LABELS: Record<"kg" | "unit", string> = {
  kg: "Quilograma (kg)",
  unit: "Unidade",
};
