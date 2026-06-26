"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import { addressSchema, type AddressInput } from "./schemas";

async function resolveCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
) {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function addAddressAction(
  input: AddressInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  const { data, error } = await supabase
    .from("addresses")
    .insert({ customer_id: customerId, ...parsed.data })
    .select("id")
    .single<{ id: string }>();

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { ok: true, id: data.id };
}

export async function updateAddressAction(
  addressId: string,
  input: AddressInput
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  const { error } = await supabase
    .from("addresses")
    .update(parsed.data)
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { ok: true };
}

export async function deleteAddressAction(
  addressId: string
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { ok: true };
}

export async function setDefaultAddressAction(
  addressId: string
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Não autenticado." };

  const supabase = await createClient();
  const customerId = await resolveCustomerId(supabase, profile.id);
  if (!customerId) return { error: "Perfil de cliente não encontrado." };

  // Remove is_default de todos, depois seta no endereço escolhido
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("customer_id", customerId);

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { ok: true };
}
