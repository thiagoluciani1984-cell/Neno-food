import { z } from "zod";
import { ESTABLISHMENT_TYPES } from "@/core/domain/value-objects/establishment-type";

export const step1Schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  establishment_type: z.enum(ESTABLISHMENT_TYPES),
  cuisine: z.string().min(2, "Informe o tipo de culinária"),
  description: z.string().max(500).optional(),
  price_range: z.coerce.number().int().min(1).max(4),
});

export const step2Schema = z.object({
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .max(20),
  whatsapp: z.string().max(20).optional(),
  email: z.string().email("E-mail inválido"),
  instagram: z.string().max(100).optional(),
  website: z.string().url("URL inválida").or(z.literal("")).optional(),
  address_street: z.string().min(3, "Informe a rua"),
  address_number: z.string().min(1, "Informe o número"),
  address_complement: z.string().max(100).optional(),
  address_district: z.string().min(2, "Informe o bairro"),
  address_city: z.string().min(2, "Informe a cidade"),
  address_state: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  address_zip: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  avg_prep_minutes: z.coerce
    .number()
    .int()
    .min(1, "Informe pelo menos 1 minuto")
    .max(180, "Máximo de 180 minutos"),
});

export const step3Schema = z.object({
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, "CNPJ inválido"),
  chef_name: z.string().min(2, "Informe o nome do responsável"),
  history: z.string().max(1000).optional(),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
