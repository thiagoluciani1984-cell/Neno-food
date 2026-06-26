import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com SERVICE ROLE. IGNORA RLS — use APENAS no servidor,
 * em operações confiáveis (webhooks, tarefas administrativas, seeds).
 * NUNCA importe este módulo em código que rode no cliente.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente no ambiente.");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
