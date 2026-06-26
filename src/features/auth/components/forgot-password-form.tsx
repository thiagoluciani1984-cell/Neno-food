"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction, type ActionResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviar link de recuperação"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    forgotPasswordAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl font-bold">Recuperar senha</h2>
        <p className="text-sm text-muted-foreground">
          Enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          Link enviado! Verifique seu e-mail.
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
