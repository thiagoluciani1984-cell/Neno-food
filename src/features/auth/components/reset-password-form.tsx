"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordAction, type ActionResult } from "@/features/auth/actions";
import { createClient } from "@/infra/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="nenos" className="w-full" disabled={pending}>
      {pending ? "Salvando..." : "Definir nova senha"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [state, formAction] = useActionState<ActionResult, FormData>(
    resetPasswordAction,
    {}
  );

  useEffect(() => {
    let cancelled = false;

    async function ensureRecoverySession() {
      const supabase = createClient();
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) setSessionError("Link inválido ou expirado. Solicite um novo.");
          return;
        }
        router.replace("/auth/reset-password");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!cancelled) {
        if (!user) {
          setSessionError("Sessão inválida. Solicite um novo link de recuperação.");
        }
        setReady(true);
      }
    }

    void ensureRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Validando link...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="space-y-5">
        <Logo />
        <div className="space-y-1.5">
          <h2 className="font-serif text-2xl font-bold">Link expirado</h2>
          <p className="text-sm text-muted-foreground">{sessionError}</p>
        </div>
        <Button asChild variant="nenos" className="w-full">
          <Link href="/forgot-password">Solicitar novo link</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl font-bold">Nova senha</h2>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha segura com pelo menos 8 caracteres.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repita a senha"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
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
