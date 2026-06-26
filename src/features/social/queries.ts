import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";
import type { Post, PostImage } from "@/types/database.types";

export type PostWithImages = Post & {
  post_images: PostImage[];
};

export async function getRestaurantPosts(): Promise<PostWithImages[]> {
  const { profile } = await getSession();
  if (!profile?.restaurant_id) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, post_images(*)")
    .eq("restaurant_id", profile.restaurant_id)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as PostWithImages[];
}

export async function getRestaurantPostStats(restaurantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("likes_count, comments_count, saves_count")
    .eq("restaurant_id", restaurantId)
    .is("deleted_at", null);

  if (!data?.length) return { totalPosts: 0, totalLikes: 0, totalComments: 0, totalSaves: 0 };

  return {
    totalPosts: data.length,
    totalLikes: data.reduce((s, p) => s + p.likes_count, 0),
    totalComments: data.reduce((s, p) => s + p.comments_count, 0),
    totalSaves: data.reduce((s, p) => s + p.saves_count, 0),
  };
}
