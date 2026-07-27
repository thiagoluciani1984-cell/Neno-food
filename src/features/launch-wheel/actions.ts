"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import { WHEEL_SEGMENTS, WHEEL_MAX_ORDERS } from "./constants";
import type { LaunchWheelSpin } from "@/types/database.types";

export type SpinWheelResult =
  | { ok: true; spin: LaunchWheelSpin; isNew: boolean }
  | { ok: false; error: string };

export async function spinWheelAction(): Promise<SpinWheelResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Faça login para girar a roleta." };

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle<{ id: string }>();

  if (!customer) return { ok: false, error: "Perfil de cliente não encontrado." };

  const { data: existingSpins } = await supabase
    .from("launch_wheel_spins")
    .select("*")
    .eq("customer_id", customer.id)
    .order("order_sequence", { ascending: true });

  const spins = (existingSpins ?? []) as LaunchWheelSpin[];
  const activeSpin = spins.find((s) => !s.order_id);
  if (activeSpin) {
    return { ok: true, spin: activeSpin, isNew: false };
  }

  if (spins.length >= WHEEL_MAX_ORDERS) {
    return { ok: false, error: "Você já usou os 5 giros da campanha de lançamento." };
  }

  const discountPercent =
    WHEEL_SEGMENTS[Math.floor(Math.random() * WHEEL_SEGMENTS.length)];

  const { data: created, error } = await supabase
    .from("launch_wheel_spins")
    .insert({
      customer_id: customer.id,
      order_sequence: spins.length + 1,
      discount_percent: discountPercent,
    })
    .select("*")
    .single<LaunchWheelSpin>();

  if (error || !created) {
    return { ok: false, error: "Não foi possível girar a roleta. Tente novamente." };
  }

  revalidatePath("/checkout");
  revalidatePath("/[restaurantSlug]/checkout", "page");

  return { ok: true, spin: created, isNew: true };
}
