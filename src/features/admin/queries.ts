import "server-only";
import { createAdminClient } from "@/infra/supabase/admin";

export type AdminDriverRow = {
  id: string;
  approval_status: string;
  status: string;
  cpf: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  total_deliveries: number;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  driver_documents: { id: string; doc_type: string; status: string }[];
};

export async function listDriversForAdmin(): Promise<AdminDriverRow[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("drivers")
    .select(
      `
      id, approval_status, status, cpf, vehicle_type, vehicle_plate,
      total_deliveries, created_at,
      profiles(full_name, email, phone),
      driver_documents(id, doc_type, status)
    `
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const docs = Array.isArray(row.driver_documents)
      ? row.driver_documents
      : row.driver_documents
        ? [row.driver_documents]
        : [];
    return {
      ...row,
      profiles: profile ?? null,
      driver_documents: docs,
    };
  }) as AdminDriverRow[];
}

export type PostReportRow = {
  id: string;
  reason: string;
  detail: string | null;
  created_at: string;
  post: {
    id: string;
    caption: string | null;
    restaurant: { name: string; slug: string } | null;
  } | null;
  reporter: { full_name: string | null; email: string | null } | null;
};

export async function listUnresolvedPostReports(): Promise<PostReportRow[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("post_reports")
    .select(
      `
      id, reason, detail, created_at,
      post:posts!post_id(id, caption, deleted_at, restaurant:restaurants!restaurant_id(name, slug)),
      reporter:profiles!reporter_id(full_name, email)
    `
    )
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => {
    const post = Array.isArray(row.post) ? row.post[0] : row.post;
    const restaurant = post?.restaurant
      ? Array.isArray(post.restaurant)
        ? post.restaurant[0]
        : post.restaurant
      : null;
    const reporter = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter;
    return {
      id: row.id,
      reason: row.reason,
      detail: row.detail,
      created_at: row.created_at,
      post: post
        ? {
            id: post.id,
            caption: post.caption,
            restaurant,
          }
        : null,
      reporter,
    };
  }) as PostReportRow[];
}
