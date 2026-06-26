"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";

type ActionResult = { ok: false; error: string } | { ok: true };

export async function inviteStaffAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const email     = (formData.get("email") as string)?.trim().toLowerCase();
  const job_title = (formData.get("job_title") as string)?.trim() || "staff";

  if (!email) return { ok: false, error: "Informe o e-mail." };

  const supabase = await createClient();

  // Busca o profile pelo e-mail
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("email", email)
    .single();

  if (!targetProfile) {
    return {
      ok: false,
      error: "Nenhuma conta encontrada com este e-mail. Peça para o usuário se cadastrar primeiro em nenos.app/signup.",
    };
  }

  // Verifica se já é staff
  const { data: existing } = await supabase
    .from("restaurant_staff")
    .select("id, is_active")
    .eq("restaurant_id", profile.restaurant_id)
    .eq("profile_id", targetProfile.id)
    .single();

  if (existing) {
    if (existing.is_active) return { ok: false, error: "Este usuário já é membro da equipe." };
    // Reativa
    await supabase
      .from("restaurant_staff")
      .update({ is_active: true, job_title })
      .eq("id", existing.id);
    revalidatePath("/dashboard/staff");
    return { ok: true };
  }

  // Vincula o profile ao restaurante como staff
  const { error } = await supabase.from("restaurant_staff").insert({
    restaurant_id: profile.restaurant_id,
    profile_id:    targetProfile.id,
    job_title,
    is_active:     true,
    invited_by:    profile.id,
  });

  if (error) return { ok: false, error: error.message };

  // Atualiza role do profile para "staff" se for "customer"
  if (targetProfile.role === "customer") {
    await supabase
      .from("profiles")
      .update({ role: "staff", restaurant_id: profile.restaurant_id })
      .eq("id", targetProfile.id);
  }

  revalidatePath("/dashboard/staff");
  return { ok: true };
}

export async function removeStaffAction(staffId: string): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_staff")
    .update({ is_active: false })
    .eq("id", staffId)
    .eq("restaurant_id", profile.restaurant_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/staff");
  return { ok: true };
}
