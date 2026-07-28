import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/infra/supabase/admin";

/** IP do cliente, via cabeçalho que a Vercel garante nas edge functions. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Limite simples por janela de tempo, contado no Postgres (sem Redis).
 * Retorna true se AINDA está dentro do limite (requisição permitida).
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: maxCount,
      p_window_seconds: windowSeconds,
    });
    if (error) return true; // falha no limitador não deve bloquear uso legítimo
    return data === true;
  } catch {
    return true;
  }
}
