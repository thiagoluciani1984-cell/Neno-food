"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import { ensureDeliveryCode } from "@/features/delivery/queries";
import { siteConfig } from "@/config/site";
import { getAvailableOrders, type AvailableOrder } from "./queries";
import {
  driverSignupSchema,
  driverPersonalSchema,
  driverVehicleSchema,
  type DriverPersonalInput,
  type DriverVehicleInput,
} from "./schemas";

type Result<T = void> = { ok: true; data?: T } | { error: string };

// ─── Signup ──────────────────────────────────────────────────────────

export async function driverSignupAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = driverSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    cpf: formData.get("cpf"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        role: "driver",
      },
      emailRedirectTo: `${siteConfig.url}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // Após signup o trigger cria profile + driver (via 0021 trigger).
  // Salvamos o CPF no driver record assim que o profile existir.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Aguarda o trigger propagar (pode usar service_role se necessário)
    await supabase
      .from("drivers")
      .update({ cpf: parsed.data.cpf })
      .eq("profile_id", user.id);
  }

  revalidatePath("/", "layout");
  redirect("/driver/onboarding");
}

// ─── Dados pessoais ──────────────────────────────────────────────────

export async function saveDriverPersonalAction(
  input: DriverPersonalInput
): Promise<Result> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const parsed = driverPersonalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({
      cpf: parsed.data.cpf,
      birth_date: parsed.data.birth_date,
      pix_key_type: parsed.data.pix_key_type,
      pix_key: parsed.data.pix_key,
      emergency_contact_name: parsed.data.emergency_contact_name,
      emergency_contact_phone: parsed.data.emergency_contact_phone,
    })
    .eq("profile_id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/driver");
  revalidatePath("/driver/onboarding");
  return { ok: true };
}

// ─── Veículo ─────────────────────────────────────────────────────────

export async function saveDriverVehicleAction(
  input: DriverVehicleInput
): Promise<Result> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const parsed = driverVehicleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();

  // Buscar driver_id
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, vehicle_type")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string; vehicle_type: string }>();
  if (!driver) return { error: "Registro de entregador não encontrado." };

  // Desativar veículos anteriores
  await supabase
    .from("driver_vehicles")
    .update({ is_active: false })
    .eq("driver_id", driver.id);

  // Inserir novo veículo
  const { error: vErr } = await supabase.from("driver_vehicles").insert({
    driver_id: driver.id,
    ...parsed.data,
    is_active: true,
  });
  if (vErr) return { error: vErr.message };

  // Atualizar vehicle_type no driver principal
  await supabase
    .from("drivers")
    .update({ vehicle_type: parsed.data.type, vehicle_plate: parsed.data.plate })
    .eq("id", driver.id);

  revalidatePath("/driver");
  revalidatePath("/driver/onboarding");
  return { ok: true };
}

// ─── Upload de documentos ─────────────────────────────────────────────

const ALLOWED_DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadDriverDocumentAction(
  docType: string,
  formData: FormData
): Promise<Result<{ url: string }>> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Nenhum arquivo enviado." };
  if (file.size > MAX_DOC_SIZE) return { error: "Arquivo muito grande (máx. 10 MB)." };
  if (!ALLOWED_DOC_TYPES.includes(file.type))
    return { error: "Formato inválido. Use JPG, PNG, WEBP ou PDF." };

  const supabase = await createClient();
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string }>();
  if (!driver) return { error: "Registro de entregador não encontrado." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${driver.id}/${docType}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("driver-docs")
    .upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };

  // Remover doc anterior do mesmo tipo
  await supabase
    .from("driver_documents")
    .delete()
    .eq("driver_id", driver.id)
    .eq("doc_type", docType);

  // Registrar doc
  const { error: dbErr } = await supabase.from("driver_documents").insert({
    driver_id: driver.id,
    doc_type: docType,
    storage_path: path,
    original_name: file.name,
    status: "pending",
  });
  if (dbErr) return { error: dbErr.message };

  // Gerar signed URL (válida por 5 min para preview)
  const { data: signed } = await supabase.storage
    .from("driver-docs")
    .createSignedUrl(path, 300);

  revalidatePath("/driver/onboarding");
  return { ok: true, data: { url: signed?.signedUrl ?? "" } };
}

// ─── Status online/offline ───────────────────────────────────────────

export async function updateDriverStatusAction(
  status: "online" | "offline"
): Promise<Result> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({ status: status === "online" ? "available" : "offline" })
    .eq("profile_id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/driver");
  return { ok: true };
}

// ─── Fila de pedidos disponíveis (usado pelo polling/realtime) ────────

export async function getAvailableOrdersAction(): Promise<AvailableOrder[]> {
  const { profile } = await getSession();
  if (!profile?.id) return [];
  return getAvailableOrders();
}

// ─── Aceitar pedido ───────────────────────────────────────────────────

export async function acceptOrderAction(orderId: string): Promise<Result> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, status, approval_status")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string; status: string; approval_status: string }>();

  if (!driver) return { error: "Perfil de entregador não encontrado." };
  if (driver.approval_status !== "approved") return { error: "Sua conta ainda não foi aprovada." };
  if (driver.status !== "available") return { error: "Você precisa estar disponível." };

  // Atribuir pedido atomicamente (garante que não foi pego por outro)
  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      driver_id: driver.id,
      status: "out_for_delivery",
      picked_up_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "ready")
    .is("driver_id", null)
    .select("id")
    .maybeSingle();

  if (error || !updated) return { error: "Pedido não disponível mais." };

  await ensureDeliveryCode(orderId, supabase);

  // Marcar entregador como ocupado
  await supabase
    .from("drivers")
    .update({ status: "busy" })
    .eq("id", driver.id);

  revalidatePath("/driver");
  return { ok: true };
}

// ─── Atualizar status da entrega ──────────────────────────────────────

export async function completeDeliveryAction(
  orderId: string,
  deliveryCode?: string
): Promise<Result> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string }>();
  if (!driver) return { error: "Perfil não encontrado." };

  if (deliveryCode?.trim()) {
    const { data: codeRow } = await supabase
      .from("delivery_codes")
      .select("code, confirmed_at")
      .eq("order_id", orderId)
      .maybeSingle<{ code: string; confirmed_at: string | null }>();

    if (!codeRow) return { error: "Código de entrega não encontrado." };
    if (codeRow.confirmed_at) return { error: "Entrega já confirmada." };
    if (codeRow.code !== deliveryCode.trim()) {
      return { error: "Código incorreto. Peça ao cliente o PIN de entrega." };
    }

    await supabase
      .from("delivery_codes")
      .update({ confirmed_at: new Date().toISOString(), confirmed_by: driver.id })
      .eq("order_id", orderId);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: now })
    .eq("id", orderId)
    .eq("driver_id", driver.id)
    .eq("status", "out_for_delivery");

  if (error) return { error: error.message };

  // Incrementar estatísticas e liberar entregador
  const { data: order } = await supabase
    .from("orders")
    .select("delivery_fee_cents")
    .eq("id", orderId)
    .maybeSingle<{ delivery_fee_cents: number }>();

  // Atualizar estatísticas manualmente
  const { data: driverStats } = await supabase
    .from("drivers")
    .select("total_deliveries, total_earnings_cents")
    .eq("id", driver.id)
    .maybeSingle<{ total_deliveries: number; total_earnings_cents: number }>();

  if (driverStats) {
    await supabase
      .from("drivers")
      .update({
        total_deliveries: driverStats.total_deliveries + 1,
        total_earnings_cents:
          driverStats.total_earnings_cents + (order?.delivery_fee_cents ?? 0),
        status: "available",
      })
      .eq("id", driver.id);
  }

  revalidatePath("/driver");
  return { ok: true };
}

export async function reportDriverLocationAction(
  orderId: string,
  latitude: number,
  longitude: number
): Promise<Result> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle<{ id: string }>();
  if (!driver) return { error: "Perfil não encontrado." };

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("driver_id", driver.id)
    .eq("status", "out_for_delivery")
    .maybeSingle();

  if (!order) return { error: "Entrega não ativa." };

  const { error } = await supabase.from("delivery_tracking").insert({
    order_id: orderId,
    driver_id: driver.id,
    latitude,
    longitude,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
