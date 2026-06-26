"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import {
  categorySchema,
  productSchema,
  slugify,
  type CategoryInput,
  type ProductInput,
} from "./schemas";

type Result = { ok: boolean; error?: string; id?: string };

// ─── Categorias ───────────────────────────────────────────────────────
export async function saveCategoryAction(input: CategoryInput): Promise<Result> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message };

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não identificado." };

  const supabase = await createClient();
  const payload = {
    restaurant_id: restaurantId,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description ?? null,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  };

  const query = parsed.data.id
    ? supabase.from("categories").update(payload).eq("id", parsed.data.id).select("id").single()
    : supabase.from("categories").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/menu");
  return { ok: true, id: (data as { id: string }).id };
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  return { ok: true };
}

// ─── Produtos ─────────────────────────────────────────────────────────
export async function saveProductAction(input: ProductInput): Promise<Result> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message };

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não identificado." };

  if (
    parsed.data.promoPriceCents != null &&
    parsed.data.promoPriceCents >= parsed.data.priceCents
  ) {
    return { ok: false, error: "O preço promocional deve ser menor que o preço." };
  }

  const supabase = await createClient();
  const payload = {
    restaurant_id: restaurantId,
    category_id: parsed.data.categoryId ?? null,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description ?? null,
    image_url: parsed.data.imageUrl || null,
    price_cents: parsed.data.priceCents,
    promo_price_cents: parsed.data.promoPriceCents ?? null,
    is_available: parsed.data.isAvailable,
    is_featured: parsed.data.isFeatured,
  };

  const query = parsed.data.id
    ? supabase.from("products").update(payload).eq("id", parsed.data.id).select("id").single()
    : supabase.from("products").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/menu");
  revalidatePath("/");
  return { ok: true, id: (data as { id: string }).id };
}

export async function toggleProductAvailabilityAction(
  id: string,
  isAvailable: boolean
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProductAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_available: false })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  revalidatePath("/");
  return { ok: true };
}

// ─── Upload de imagem para o Storage ──────────────────────────────────
export async function uploadProductImageAction(
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Arquivo inválido." };

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não identificado." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
