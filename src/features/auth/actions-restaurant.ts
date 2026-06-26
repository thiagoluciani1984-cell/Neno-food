"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infra/supabase/server";
import { siteConfig } from "@/config/site";
import { z } from "zod";

const restaurantSignupSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido").optional().or(z.literal("")),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

type ActionResult = { error?: string; success?: boolean };

export async function restaurantSignupAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = restaurantSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        role: "restaurant",
      },
      emailRedirectTo: `${siteConfig.url}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/onboarding/1");
}
