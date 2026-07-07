"use server";

import { createClient } from "@/infra/supabase/server";
import { getSession } from "@/features/auth/get-session";

export async function toggleLikeAction(
  postId: string
): Promise<{ liked: boolean } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Faça login para curtir." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("profile_id", profile.id);
    return { liked: false };
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, profile_id: profile.id });
    return { liked: true };
  }
}

export async function toggleSaveAction(
  postId: string
): Promise<{ saved: boolean } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Faça login para salvar." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("post_saves")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_saves").delete().eq("post_id", postId).eq("profile_id", profile.id);
    return { saved: false };
  } else {
    await supabase.from("post_saves").insert({ post_id: postId, profile_id: profile.id });
    return { saved: true };
  }
}

export async function addCommentAction(
  postId: string,
  body: string
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Faça login para comentar." };
  if (!body.trim()) return { error: "Comentário vazio." };

  const supabase = await createClient();
  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    author_id: profile.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export type PostComment = {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; full_name: string; avatar_url: string | null };
};

export async function fetchPostCommentsAction(
  postId: string
): Promise<PostComment[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("post_comments")
    .select(`
      id, body, created_at,
      author:profiles!author_id(id, full_name, avatar_url)
    `)
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(30);

  if (!data) return [];

  return data.map((c: any) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: Array.isArray(c.author) ? c.author[0] : c.author,
  }));
}

export async function fetchMorePostsAction(
  page: number
): Promise<import("./queries").FeedPost[]> {
  const { getFeedPosts } = await import("./queries");
  return getFeedPosts(page);
}

const REPORT_REASONS = ["spam", "inappropriate", "misleading", "other"] as const;

export async function reportPostAction(
  postId: string,
  reason: string,
  detail?: string
): Promise<{ ok: true } | { error: string }> {
  const { profile } = await getSession();
  if (!profile?.id) return { error: "Faça login para denunciar." };

  if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) {
    return { error: "Motivo inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("post_reports").insert({
    post_id: postId,
    reporter_id: profile.id,
    reason,
    detail: detail?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Você já denunciou este post." };
    return { error: error.message };
  }

  return { ok: true };
}
