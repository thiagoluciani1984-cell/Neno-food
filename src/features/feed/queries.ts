import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";

export type FeedPost = {
  id: string;
  caption: string | null;
  type: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  restaurant: { id: string; name: string; slug: string; logo_url: string | null };
  author: { id: string; full_name: string; avatar_url: string | null };
  post_images: { id: string; url: string; alt: string | null; sort_order: number }[];
  is_liked: boolean;
  is_saved: boolean;
};

type RawImage = { id: string; url: string; alt: string | null; sort_order: number };
type RawJoin<T> = T | T[];

type RawPost = {
  id: string;
  caption: string | null;
  type: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  restaurant: RawJoin<{ id: string; name: string; slug: string; logo_url: string | null }>;
  author: RawJoin<{ id: string; full_name: string; avatar_url: string | null }>;
  post_images: RawImage[] | null;
};

function unwrap<T>(v: RawJoin<T>): T {
  return Array.isArray(v) ? v[0] : v;
}

const PAGE_SIZE = 12;

async function attachLikeSaveStatus(
  posts: RawPost[],
  profileId?: string
): Promise<FeedPost[]> {
  if (!posts.length) return [];

  const postIds = posts.map((p) => p.id);
  const supabase = await createClient();

  const [likedResult, savedResult] = await Promise.all([
    profileId
      ? supabase.from("post_likes").select("post_id").eq("profile_id", profileId).in("post_id", postIds)
      : { data: [] as { post_id: string }[] },
    profileId
      ? supabase.from("post_saves").select("post_id").eq("profile_id", profileId).in("post_id", postIds)
      : { data: [] as { post_id: string }[] },
  ]);

  const likedIds = new Set((likedResult.data ?? []).map((r) => r.post_id));
  const savedIds = new Set((savedResult.data ?? []).map((r) => r.post_id));

  return posts.map((p) => ({
    id: p.id,
    caption: p.caption,
    type: p.type,
    is_pinned: p.is_pinned,
    likes_count: p.likes_count,
    comments_count: p.comments_count,
    saves_count: p.saves_count,
    created_at: p.created_at,
    restaurant: unwrap(p.restaurant),
    author: unwrap(p.author),
    post_images: (p.post_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    is_liked: likedIds.has(p.id),
    is_saved: savedIds.has(p.id),
  }));
}

const FEED_SELECT = `
  id, caption, type, is_pinned, likes_count, comments_count, saves_count, created_at,
  restaurant:restaurants!restaurant_id(id, name, slug, logo_url),
  author:profiles!author_id(id, full_name, avatar_url),
  post_images(id, url, alt, sort_order)
` as const;

export async function getFeedPosts(page = 0): Promise<FeedPost[]> {
  const { profile } = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  return attachLikeSaveStatus((data ?? []) as unknown as RawPost[], profile?.id);
}

export async function getRestaurantFeedPosts(restaurantId: string, page = 0): Promise<FeedPost[]> {
  const { profile } = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .eq("restaurant_id", restaurantId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  return attachLikeSaveStatus((data ?? []) as unknown as RawPost[], profile?.id);
}

export async function getSavedPostsForProfile(profileId: string): Promise<FeedPost[]> {
  const supabase = await createClient();

  const { data: saves } = await supabase
    .from("post_saves")
    .select("post_id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(30);

  const postIds = (saves ?? []).map((s) => s.post_id);
  if (!postIds.length) return [];

  const { data } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .in("id", postIds)
    .is("deleted_at", null);

  const posts = (data ?? []) as unknown as RawPost[];
  const byId = new Map(posts.map((p) => [p.id, p]));

  return attachLikeSaveStatus(
    postIds.map((id) => byId.get(id)).filter(Boolean) as RawPost[],
    profileId
  );
}
