"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";

export async function markNotificationReadAction(
  id: string
): Promise<{ ok: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}
