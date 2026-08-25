import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso no SERVIDOR (Server Components, Server Actions,
 * Route Handlers). Lê/escreve a sessão via cookies. Respeita RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {
            // chamado de um Server Component — ignorável quando há middleware
            // cuidando do refresh da sessão.
          }
        },
      },
    }
  );
}

/**
 * Cliente Supabase anônimo, sem tocar em `cookies()`. Respeita RLS como o
 * papel `anon` (sem sessão de usuário) — use só pra dados públicos que não
 * dependem de quem está logado. Necessário pra funções chamadas dentro de
 * `unstable_cache`, que não pode usar APIs dinâmicas como `cookies()`.
 */
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
