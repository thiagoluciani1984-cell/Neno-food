import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { Notification } from "@/types/database.types";

export async function getMyNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return count ?? 0;
}
