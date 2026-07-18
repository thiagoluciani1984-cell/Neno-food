import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;
let realtimeAuthReady: Promise<void> | undefined;

/**
 * Cliente Supabase para uso no BROWSER (Client Components).
 * Usa apenas a anon key; toda a autorização é garantida por RLS.
 *
 * Singleton: instanciar um novo client a cada chamada (como antes) faz cada
 * um reiniciar a restauração de sessão via cookies do zero, e o socket do
 * Realtime abre e se inscreve ANTES dessa sessão resolver — o canal nunca
 * recebe o access_token do usuário e o RLS bloqueia os eventos em silêncio.
 * Reautenticar um canal já inscrito via setAuth() não reenvia o token pro
 * canal existente nesta versão da lib — por isso quem for usar Realtime
 * precisa aguardar `getRealtimeAuthReady()` antes de dar subscribe().
 */
export function createClient() {
  if (browserClient) return browserClient;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  realtimeAuthReady = supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) supabase.realtime.setAuth(session.access_token);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    supabase.realtime.setAuth(session?.access_token ?? null);
  });

  browserClient = supabase;
  return supabase;
}

/** Resolve assim que o token do usuário (se houver) foi repassado pro Realtime. */
export function getRealtimeAuthReady(): Promise<void> {
  return realtimeAuthReady ?? Promise.resolve();
}
