"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";

type ActionResult = { ok: false; error: string } | { ok: true };

async function assertOwnsProduct(productId: string): Promise<{ restaurantId: string } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { error: "Sem restaurante." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("restaurant_id")
    .eq("id", productId)
    .single();

  if (!data) return { error: "Produto não encontrado." };
  if (data.restaurant_id !== profile.restaurant_id) return { error: "Não autorizado." };
  return { restaurantId: profile.restaurant_id };
}

// ─── Option groups ─────────────────────────────────────────────────────────

const groupSchema = z.object({
  name:        z.string().min(1, "Informe o nome do grupo"),
  type:        z.enum(["single", "multiple"]),
  is_required: z.coerce.boolean(),
  min_qty:     z.coerce.number().int().min(0),
  max_qty:     z.coerce.number().int().min(1),
});

export async function saveOptionGroupAction(
  productId: string,
  groupId: string | null,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertOwnsProduct(productId);
  if ("error" in auth) return { ok: false, error: auth.error };

  const parsed = groupSchema.safeParse({
    name:        formData.get("name"),
    type:        formData.get("type"),
    is_required: formData.get("is_required") === "true",
    min_qty:     formData.get("min_qty"),
    max_qty:     formData.get("max_qty"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Inválido" };

  const supabase = await createClient();

  if (groupId) {
    const { error } = await supabase
      .from("product_options")
      .update(parsed.data)
      .eq("id", groupId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: last } = await supabase
      .from("product_options")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const { error } = await supabase.from("product_options").insert({
      product_id: productId,
      ...parsed.data,
      sort_order: (last?.sort_order ?? 0) + 1,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/menu");
  return { ok: true };
}

export async function deleteOptionGroupAction(
  productId: string,
  groupId: string
): Promise<ActionResult> {
  const auth = await assertOwnsProduct(productId);
  if ("error" in auth) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_options")
    .delete()
    .eq("id", groupId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  return { ok: true };
}

// ─── Option items ──────────────────────────────────────────────────────────

const itemSchema = z.object({
  name:        z.string().min(1, "Informe o nome"),
  price_cents: z.coerce.number().int().min(0),
});

export async function saveOptionItemAction(
  productId: string,
  optionId: string,
  itemId: string | null,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertOwnsProduct(productId);
  if ("error" in auth) return { ok: false, error: auth.error };

  const parsed = itemSchema.safeParse({
    name:        formData.get("name"),
    price_cents: formData.get("price_cents"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Inválido" };

  const supabase = await createClient();

  if (itemId) {
    const { error } = await supabase
      .from("product_option_items")
      .update(parsed.data)
      .eq("id", itemId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: last } = await supabase
      .from("product_option_items")
      .select("sort_order")
      .eq("option_id", optionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const { error } = await supabase.from("product_option_items").insert({
      option_id:   optionId,
      ...parsed.data,
      sort_order:  (last?.sort_order ?? 0) + 1,
      is_available: true,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/menu");
  return { ok: true };
}

export async function deleteOptionItemAction(
  productId: string,
  itemId: string
): Promise<ActionResult> {
  const auth = await assertOwnsProduct(productId);
  if ("error" in auth) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_option_items")
    .delete()
    .eq("id", itemId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  return { ok: true };
}
