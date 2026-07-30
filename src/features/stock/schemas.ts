import { z } from "zod";

export const stockItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Informe o nome do insumo").max(120),
  unit_type: z.enum(["g", "kg", "ml", "l", "un"]),
  min_quantity: z.number().min(0),
  unit_cost_cents: z.number().int().min(0),
});

export type StockItemInput = z.infer<typeof stockItemSchema>;

export const stockRecipeSchema = z.object({
  product_id: z.string().uuid(),
  stock_item_id: z.string().uuid(),
  quantity_per_unit: z.number().positive("Quantidade deve ser maior que zero"),
});

export type StockRecipeInput = z.infer<typeof stockRecipeSchema>;

export const stockMovementSchema = z.object({
  stock_item_id: z.string().uuid(),
  type: z.enum(["in", "out"]),
  reason: z.enum(["purchase", "loss", "adjustment"]),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  unit_cost_cents: z.number().int().min(0).optional(),
  notes: z.string().max(300).nullable().optional(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;

export const UNIT_TYPE_LABELS: Record<"g" | "kg" | "ml" | "l" | "un", string> = {
  g: "Grama (g)",
  kg: "Quilograma (kg)",
  ml: "Mililitro (ml)",
  l: "Litro (l)",
  un: "Unidade",
};

export const MOVEMENT_REASON_LABELS: Record<
  "purchase" | "sale_deduction" | "loss" | "adjustment" | "supply_transfer",
  string
> = {
  purchase: "Compra",
  sale_deduction: "Baixa por venda",
  loss: "Perda / quebra / vencimento",
  adjustment: "Ajuste manual",
  supply_transfer: "Insumo entre restaurantes",
};
