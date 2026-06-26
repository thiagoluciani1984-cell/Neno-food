import { z } from "zod";

export const reviewSchema = z.object({
  restaurant_id: z.string().uuid(),
  order_id: z.string().uuid().optional(),
  rating: z.number().int().min(1, "Selecione ao menos 1 estrela").max(5),
  comment: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
