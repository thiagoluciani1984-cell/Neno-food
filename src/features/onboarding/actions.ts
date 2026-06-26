"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import { step1Schema, step2Schema, step3Schema } from "./schemas";

type ActionResult = { ok: false; error: string } | { ok: true };

// ─── helpers ──────────────────────────────────────────────────────────

async function getOrCreateRestaurant(): Promise<
  { restaurantId: string } | { error: string }
> {
  const { user, profile } = await getSession();
  if (!user || !profile) return { error: "Não autenticado" };

  const supabase = await createClient();

  if (profile.restaurant_id) {
    return { restaurantId: profile.restaurant_id };
  }

  // Cria restaurante rascunho para este owner
  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name: "Meu Restaurante",
      slug: `restaurant-${user.id.slice(0, 8)}`,
      cuisine: "geral",
      status: "pending",
      onboarding_status: "draft",
      registration_step: 1,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Erro ao criar restaurante" as const };

  // Vincula profile ao restaurante
  await supabase
    .from("profiles")
    .update({ restaurant_id: data.id, role: "restaurant" })
    .eq("id", user.id);

  return { restaurantId: data.id };
}

// ─── Step 1: dados básicos ────────────────────────────────────────────

export async function saveStep1Action(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = step1Schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    establishment_type: formData.get("establishment_type"),
    cuisine: formData.get("cuisine"),
    description: formData.get("description"),
    price_range: formData.get("price_range"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const result = await getOrCreateRestaurant();
  if ("error" in result) return { ok: false, error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      establishment_type: parsed.data.establishment_type,
      cuisine: parsed.data.cuisine,
      description: parsed.data.description ?? null,
      price_range: parsed.data.price_range,
      registration_step: 2,
      onboarding_status: "draft",
    })
    .eq("id", result.restaurantId);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Este endereço (slug) já está em uso. Escolha outro." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/onboarding");
  redirect("/onboarding/2");
}

// ─── Step 2: contato e endereço ──────────────────────────────────────

export async function saveStep2Action(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = step2Schema.safeParse({
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    instagram: formData.get("instagram"),
    website: formData.get("website"),
    address_street: formData.get("address_street"),
    address_number: formData.get("address_number"),
    address_complement: formData.get("address_complement"),
    address_district: formData.get("address_district"),
    address_city: formData.get("address_city"),
    address_state: formData.get("address_state"),
    address_zip: formData.get("address_zip"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const result = await getOrCreateRestaurant();
  if ("error" in result) return { ok: false, error: result.error };

  const supabase = await createClient();

  // Atualiza dados do restaurante
  const { error: restErr } = await supabase
    .from("restaurants")
    .update({
      phone: parsed.data.phone,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp ?? null,
      instagram: parsed.data.instagram ?? null,
      website: parsed.data.website || null,
      registration_step: 3,
    })
    .eq("id", result.restaurantId);

  if (restErr) return { ok: false, error: restErr.message };

  // Upsert nas settings (endereço)
  const { error: settErr } = await supabase
    .from("restaurant_settings")
    .upsert(
      {
        restaurant_id: result.restaurantId,
        address_street: parsed.data.address_street,
        address_number: parsed.data.address_number,
        address_complement: parsed.data.address_complement ?? null,
        address_district: parsed.data.address_district,
        address_city: parsed.data.address_city,
        address_state: parsed.data.address_state.toUpperCase(),
        address_zip: parsed.data.address_zip,
      },
      { onConflict: "restaurant_id" }
    );

  if (settErr) return { ok: false, error: settErr.message };

  revalidatePath("/onboarding");
  redirect("/onboarding/3");
}

// ─── Step 3: dados jurídicos ──────────────────────────────────────────

export async function saveStep3Action(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = step3Schema.safeParse({
    cnpj: formData.get("cnpj"),
    chef_name: formData.get("chef_name"),
    history: formData.get("history"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const result = await getOrCreateRestaurant();
  if ("error" in result) return { ok: false, error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      cnpj: parsed.data.cnpj,
      chef_name: parsed.data.chef_name,
      history: parsed.data.history ?? null,
      registration_step: 4,
    })
    .eq("id", result.restaurantId);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Este CNPJ já está cadastrado." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/onboarding");
  redirect("/onboarding/4");
}

// ─── Step 4: envio para revisão ──────────────────────────────────────

export async function submitForReviewAction(): Promise<ActionResult> {
  const result = await getOrCreateRestaurant();
  if ("error" in result) return { ok: false, error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ onboarding_status: "in_review" })
    .eq("id", result.restaurantId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/onboarding");
  redirect("/onboarding/aguardando");
}
