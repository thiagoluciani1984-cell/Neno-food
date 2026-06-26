import { z } from "zod";

export const driverSignupSchema = z.object({
  fullName: z.string().min(3, "Nome completo obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z
    .string()
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido")
    .transform((v) => v.replace(/\D/g, "")),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const driverPersonalSchema = z.object({
  cpf: z
    .string()
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido")
    .transform((v) => v.replace(/\D/g, "")),
  birth_date: z.string().min(1, "Data de nascimento obrigatória"),
  pix_key_type: z.enum(["cpf", "email", "phone", "random", "cnpj"]),
  pix_key: z.string().min(3, "Chave Pix obrigatória"),
  emergency_contact_name: z.string().min(2, "Nome do contato obrigatório"),
  emergency_contact_phone: z.string().min(10, "Telefone de emergência obrigatório"),
});

export const driverVehicleSchema = z.object({
  type: z.enum(["motorcycle", "bicycle", "car", "van"]),
  brand: z.string().min(1, "Marca obrigatória"),
  model: z.string().min(1, "Modelo obrigatório"),
  year: z.coerce
    .number()
    .int()
    .min(2000, "Ano inválido")
    .max(new Date().getFullYear() + 1),
  color: z.string().min(1, "Cor obrigatória"),
  plate: z.string().min(7, "Placa inválida").toUpperCase(),
});

export type DriverSignupInput = z.infer<typeof driverSignupSchema>;
export type DriverPersonalInput = z.infer<typeof driverPersonalSchema>;
export type DriverVehicleInput = z.infer<typeof driverVehicleSchema>;
