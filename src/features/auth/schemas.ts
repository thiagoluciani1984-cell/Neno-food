import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(8, "Informe um telefone válido").optional().or(z.literal("")),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
