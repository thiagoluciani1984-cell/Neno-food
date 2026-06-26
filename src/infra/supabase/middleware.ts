import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Atualiza a sessão Supabase a cada request e protege rotas por perfil.
 * Mapeia o prefixo da rota para o(s) papel(éis) exigido(s).
 */
const ROUTE_ROLE_GUARD: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard", roles: ["restaurant", "master_admin", "staff"] },
  { prefix: "/admin",     roles: ["master_admin", "moderator"] },
  { prefix: "/driver",   roles: ["driver", "master_admin"] },
  { prefix: "/onboarding", roles: ["restaurant", "master_admin"] },
  { prefix: "/account",  roles: ["customer", "restaurant", "driver", "master_admin", "staff", "moderator"] },
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Se o Supabase ainda não foi configurado (.env.local ausente), não quebra a
  // aplicação inteira — apenas segue sem sessão/guardas. Útil em dev inicial.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const guard = ROUTE_ROLE_GUARD.find((g) => pathname.startsWith(g.prefix));

  if (guard) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !guard.roles.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
