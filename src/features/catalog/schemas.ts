import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Informe o nome da categoria"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(2, "Informe o nome do produto"),
  description: z.string().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  priceCents: z.coerce.number().int().nonnegative(),
  promoPriceCents: z.coerce.number().int().nonnegative().nullable().optional(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
