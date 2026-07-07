"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction, type ActionResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Criando conta..." : "Criar conta"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    signupAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl font-bold">Crie sua conta</h2>
        <p className="text-sm text-muted-foreground">
          Peça suas massas favoritas em poucos cliques.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" placeholder="Seu nome" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" placeholder="(11) 90000-0000" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-muted-foreground">
        Ao criar conta, você concorda com os{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
