import "server-only";
import { createClient } from "@/infra/supabase/server";

export interface StaffMember {
  id: string;
  profile_id: string;
  job_title: string;
  is_active: boolean;
  invited_at: string;
  profile: {
    full_name: string;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getRestaurantStaff(restaurantId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_staff")
    .select("id, profile_id, job_title, is_active, invited_at, profiles(full_name, email, avatar_url)")
    .eq("restaurant_id", restaurantId)
    .order("invited_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id:         row.id,
    profile_id: row.profile_id,
    job_title:  row.job_title,
    is_active:  row.is_active,
    invited_at: row.invited_at,
    profile:    Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles as StaffMember["profile"]),
  }));
}
