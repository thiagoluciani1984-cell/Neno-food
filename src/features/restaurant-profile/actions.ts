"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";

type ActionResult = { ok: false; error: string } | { ok: true };

const profileSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  description: z.string().max(500).optional(),
  history: z.string().max(1000).optional(),
  cuisine: z.string().min(2, "Informe a culinária"),
  establishment_type: z.string().min(1),
  price_range: z.coerce.number().int().min(1).max(4).optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  instagram: z.string().max(100).optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  chef_name: z.string().max(100).optional().or(z.literal("")),
  logo_url: z.string().optional().or(z.literal("")),
  cover_url: z.string().optional().or(z.literal("")),
});

export async function saveProfileAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante vinculado." };

  const parsed = profileSchema.safeParse({
    name:               formData.get("name"),
    description:        formData.get("description"),
    history:            formData.get("history"),
    cuisine:            formData.get("cuisine"),
    establishment_type: formData.get("establishment_type"),
    price_range:        formData.get("price_range"),
    phone:              formData.get("phone"),
    email:              formData.get("email"),
    whatsapp:           formData.get("whatsapp"),
    instagram:          formData.get("instagram"),
    website:            formData.get("website"),
    chef_name:          formData.get("chef_name"),
    logo_url:           formData.get("logo_url"),
    cover_url:          formData.get("cover_url"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      name:               d.name,
      description:        d.description || null,
      history:            d.history || null,
      cuisine:            d.cuisine,
      establishment_type: d.establishment_type,
      price_range:        d.price_range ?? null,
      phone:              d.phone || null,
      email:              d.email || null,
      whatsapp:           d.whatsapp || null,
      instagram:          d.instagram || null,
      website:            d.website || null,
      chef_name:          d.chef_name || null,
      ...(d.logo_url  ? { logo_url:  d.logo_url  } : {}),
      ...(d.cover_url ? { cover_url: d.cover_url } : {}),
    })
    .eq("id", profile.restaurant_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath(`/${profile.restaurant_id}`);
  return { ok: true };
}

export async function uploadRestaurantImageAction(
  formData: FormData,
  type: "logo" | "cover"
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Arquivo não enviado." };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) return { ok: false, error: "Formato não permitido." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Arquivo deve ter menos de 5MB." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profile.restaurant_id}/${type}-${Date.now()}.${ext}`;

  const supabase = await createClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("restaurant-assets")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return { ok: false, error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("restaurant-assets")
    .getPublicUrl(path);

  return { ok: true, url: publicUrl };
}
