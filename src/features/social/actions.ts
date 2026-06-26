"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";

const BUCKET = "restaurant-assets";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ActionResult = { ok: true } | { ok: false; error: string };

async function uploadPostImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  restaurantId: string
): Promise<string | null> {
  if (file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.includes(file.type)) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `restaurants/${restaurantId}/posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "31536000" });
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const caption = ((formData.get("caption") as string | null) ?? "").trim();
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);

  if (!caption && files.length === 0) {
    return { ok: false, error: "Adicione uma legenda ou pelo menos uma imagem." };
  }

  const supabase = await createClient();

  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadPostImage(supabase, file, profile.restaurant_id);
    if (!url) return { ok: false, error: `Falha ao enviar "${file.name}". Use PNG, JPG ou WEBP (máx. 8 MB).` };
    urls.push(url);
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      restaurant_id: profile.restaurant_id,
      author_id: profile.id,
      type: urls.length > 0 ? "photo" : "text",
      caption: caption || null,
    })
    .select("id")
    .single();

  if (postError || !post) return { ok: false, error: postError?.message ?? "Erro ao criar publicação." };

  if (urls.length > 0) {
    await supabase.from("post_images").insert(
      urls.map((url, i) => ({ post_id: post.id, url, sort_order: i }))
    );
  }

  revalidatePath("/dashboard/social");
  return { ok: true };
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("restaurant_id")
    .eq("id", postId)
    .single();

  if (!data || data.restaurant_id !== profile.restaurant_id)
    return { ok: false, error: "Não autorizado." };

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/social");
  return { ok: true };
}

export async function togglePinAction(postId: string, currentlyPinned: boolean): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ is_pinned: !currentlyPinned })
    .eq("id", postId)
    .eq("restaurant_id", profile.restaurant_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/social");
  return { ok: true };
}
