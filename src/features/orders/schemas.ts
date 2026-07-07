import { z } from "zod";

export const checkoutItemOptionSchema = z.object({
  optionId: z.string().uuid(),
  optionItemId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
  options: z.array(checkoutItemOptionSchema).optional().default([]),
});

export const checkoutSchema = z.object({
  restaurantId: z.string().uuid(),
  type: z.enum(["delivery", "pickup", "dine_in"]),
  paymentMethod: z.enum(["pix", "cash", "card", "online"]),
  customerName: z.string().min(2, "Informe seu nome"),
  customerPhone: z.string().min(8, "Informe um telefone"),
  customerDocument: z.string().optional(),
  onlinePaymentType: z.enum(["pix", "credit_card"]).optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  changeForCents: z.number().int().nonnegative().optional(),
  address: z
    .object({
      street: z.string().min(2),
      number: z.string().min(1),
      complement: z.string().optional(),
      district: z.string().min(2),
      city: z.string().min(2),
      state: z.string().min(2),
      zip: z.string().min(4),
      reference: z.string().optional(),
    })
    .optional(),
  items: z.array(checkoutItemSchema).min(1, "Carrinho vazio"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
