import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Informe um rótulo").max(30),
  recipient: z.string().max(80).optional(),
  street: z.string().min(3, "Informe a rua"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string().max(60).optional(),
  district: z.string().min(2, "Informe o bairro"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "UF com 2 letras").toUpperCase(),
  zip: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido (ex: 01310-100)")
    .transform((v) => v.replace("-", "")),
  reference: z.string().max(120).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
