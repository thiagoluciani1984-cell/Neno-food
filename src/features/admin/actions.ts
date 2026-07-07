"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import type { RestaurantStatus } from "@/types/database.types";

/**
 * Master admin: altera o status de um restaurante (aprovar/bloquear).
 * RLS garante que apenas master_admin consegue executar o update global.
 */
export async function setRestaurantStatusAction(
  restaurantId: string,
  status: RestaurantStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const update: Record<string, unknown> = { status };
  if (status === "active") {
    update.onboarding_status = "approved";
    update.approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("restaurants")
    .update(update)
    .eq("id", restaurantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function setDriverApprovalAction(
  driverId: string,
  approval: "approved" | "rejected"
): Promise<{ ok: boolean; error?: string }> {
  const { profile } = await getSession();
  if (profile?.role !== "master_admin") {
    return { ok: false, error: "Sem permissão." };
  }

  const { createAdminClient } = await import("@/infra/supabase/admin");
  const admin = createAdminClient();

  const update: Record<string, unknown> = { approval_status: approval };
  if (approval === "approved") {
    update.approved_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("drivers")
    .update(update)
    .eq("id", driverId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  return { ok: true };
}

export async function resolvePostReportAction(
  reportId: string,
  action: "dismiss" | "remove_post"
): Promise<{ ok: boolean; error?: string }> {
  const { profile } = await getSession();
  if (profile?.role !== "master_admin") {
    return { ok: false, error: "Sem permissão." };
  }

  const { createAdminClient } = await import("@/infra/supabase/admin");
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: report } = await admin
    .from("post_reports")
    .select("post_id")
    .eq("id", reportId)
    .maybeSingle<{ post_id: string }>();

  if (!report) return { ok: false, error: "Denúncia não encontrada." };

  if (action === "remove_post") {
    await admin
      .from("posts")
      .update({ deleted_at: now })
      .eq("id", report.post_id);
  }

  await admin
    .from("post_reports")
    .update({ resolved_at: now, resolved_by: profile.id })
    .eq("id", reportId);

  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function assignRestaurantOwnerAction(
  restaurantId: string,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const { profile } = await getSession();
  if (profile?.role !== "master_admin") {
    return { ok: false, error: "Sem permissão." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, error: "Informe o e-mail do dono." };
  }

  const { createAdminClient } = await import("@/infra/supabase/admin");
  const admin = createAdminClient();

  const { data: ownerProfile, error: findError } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", normalizedEmail)
    .maybeSingle<{ id: string; email: string | null }>();

  if (findError || !ownerProfile) {
    return { ok: false, error: "Usuário não encontrado. Peça para criar conta antes." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ restaurant_id: restaurantId, role: "restaurant" })
    .eq("id", ownerProfile.id);

  if (profileError) {
    return { ok: false, error: "Falha ao vincular perfil." };
  }

  const { error: restaurantError } = await admin
    .from("restaurants")
    .update({ owner_id: ownerProfile.id })
    .eq("id", restaurantId);

  if (restaurantError) {
    return { ok: false, error: "Falha ao vincular restaurante." };
  }

  revalidatePath("/admin");
  return { ok: true };
}
