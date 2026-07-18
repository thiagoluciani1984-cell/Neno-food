"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { driverSignupAction } from "@/features/driver/actions";

export default function DriverSignupPage() {
  const [state, action, pending] = useActionState(driverSignupAction, {});

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f9] px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Logo />
        <div className="mt-4 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
          <Truck className="h-4 w-4" />
          Seja um entregador
        </div>
      </div>

      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Cadastre-se como entregador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entregue pedidos e ganhe com flexibilidade.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" name="fullName" placeholder="Seu nome" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Celular</Label>
            <Input id="phone" name="phone" placeholder="(11) 99999-9999" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/signup" className="text-primary hover:underline">
          ← Escolher outro tipo de conta
        </Link>
      </p>
    </div>
  );
}
