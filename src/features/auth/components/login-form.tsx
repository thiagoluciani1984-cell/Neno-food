"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { loginAction, type ActionResult } from "@/features/auth/actions";
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
