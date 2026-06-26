"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import type { ImageLibrary } from "@/types/database.types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET = "restaurant-assets";

type UploadResult =
  | { ok: false; error: string }
  | { ok: true; image: ImageLibrary };

type DeleteResult = { ok: true } | { ok: false; error: string };

export async function uploadToLibraryAction(formData: FormData): Promise<UploadResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Arquivo não encontrado." };
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: "Tipo de arquivo inválido. Use PNG, JPG ou WEBP." };
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: "Arquivo muito grande. Máximo 5 MB." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `restaurants/${profile.restaurant_id}/library/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: image, error: dbError } = await supabase
    .from("image_library")
    .insert({
      restaurant_id: profile.restaurant_id,
      url: publicUrl,
      source: "upload",
      is_approved: true,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/dashboard/studio");
  return { ok: true, image: image as ImageLibrary };
}

export async function deleteFromLibraryAction(imageId: string): Promise<DeleteResult> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return { ok: false, error: "Sem restaurante." };

  const supabase = await createClient();

  const { data: image } = await supabase
    .from("image_library")
    .select("restaurant_id, url, source")
    .eq("id", imageId)
    .single();

  if (!image) return { ok: false, error: "Imagem não encontrada." };
  if (image.restaurant_id !== profile.restaurant_id) return { ok: false, error: "Não autorizado." };
  if (image.source !== "upload") return { ok: false, error: "Apenas imagens de upload podem ser removidas." };

  // Remove from storage
  try {
    const url = new URL(image.url);
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) {
      const storagePath = url.pathname.slice(idx + marker.length);
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
  } catch {
    // Storage cleanup failure is non-blocking
  }

  const { error } = await supabase.from("image_library").delete().eq("id", imageId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/studio");
  return { ok: true };
}
