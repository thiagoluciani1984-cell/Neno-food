"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { loginAction, type ActionResult } from "@/features/auth/actions";
import { createClient } from "@/infra/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.27a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Seguro", sub: "Seus dados protegidos" },
  { icon: Zap, label: "Rápido", sub: "Tudo em poucos cliques" },
  { icon: BadgeCheck, label: "Confiável", sub: "Plataforma 100% segura" },
];

export function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "";
  const [state, formAction] = useActionState<ActionResult, FormData>(
    loginAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setGoogleError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect || "/")}`,
      },
    });
    if (error) {
      setGoogleError("Não foi possível entrar com Google agora. Tente com e-mail e senha.");
      setGoogleLoading(false);
    }
    // em caso de sucesso, o navegador já é redirecionado pro Google
  }

  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="relative -mt-14 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-50 shadow-lg sm:-mt-16 sm:h-24 sm:w-24">
          <Image
            src="/brand/mascot/home-hero.png"
            alt=""
            fill
            sizes="96px"
            className="scale-[1.3] object-contain object-bottom"
          />
        </span>
        <span className="leading-none">
          <span className="block text-xl font-black tracking-[-0.04em] text-primary">
            nenos
          </span>
          <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.25em] text-amber-500">
            food
          </span>
        </span>
      </div>

      <div className="space-y-1 text-center">
        <h2 className="font-serif text-2xl font-bold">Bem-vindo de volta! 👋</h2>
        <p className="text-sm text-muted-foreground">
          Entre para gerenciar pedidos ou fazer um novo.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="redirect" value={redirect} />

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@email.com"
              required
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              required
              className="pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {params.get("reset") === "success" && (
          <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            Senha alterada com sucesso. Faça login com a nova senha.
          </p>
        )}

        <SubmitButton />

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        {googleError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {googleError}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          <GoogleIcon />
          {googleLoading ? "Redirecionando..." : "Entrar com Google"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>

      <div className="flex items-center justify-center gap-4 border-t pt-5 sm:gap-6">
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
