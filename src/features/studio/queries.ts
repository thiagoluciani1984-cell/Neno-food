import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import type { ImageLibrary } from "@/types/database.types";

export async function getRestaurantImages(): Promise<ImageLibrary[]> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("image_library")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getNenosStudioImages(): Promise<ImageLibrary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("image_library")
    .select("*")
    .eq("source", "nenos_studio")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return data ?? [];
}
