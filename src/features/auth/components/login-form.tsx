"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "";
  const [state, formAction] = useActionState<ActionResult, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl font-bold">Bem-vindo de volta</h2>
        <p className="text-sm text-muted-foreground">
          Entre para gerenciar pedidos ou fazer um novo.
        </p>
      </div>

      <input type="hidden" name="redirect" value={redirect} />

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
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
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
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
  );
}
