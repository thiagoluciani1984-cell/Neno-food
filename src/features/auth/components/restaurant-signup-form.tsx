"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { restaurantSignupAction } from "../actions-restaurant";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta e iniciar cadastro"}
    </Button>
  );
}

export function RestaurantSignupForm() {
  const [state, formAction] = useActionState(restaurantSignupAction, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Cadastre seu restaurante</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Crie sua conta e comece o cadastro em 4 passos simples.
        </p>
      </div>

      {state.error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Seu nome completo</Label>
          <Input id="fullName" name="fullName" placeholder="Maria Silva" required autoComplete="name" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="maria@restaurante.com.br" required autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Celular</Label>
          <Input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" autoComplete="tel" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" required autoComplete="new-password" minLength={8} />
        </div>

        <SubmitButton />
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Ao cadastrar, você concorda com os{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      {/* Benefícios */}
      <div className="rounded-xl bg-primary/5 px-4 py-3">
        <p className="text-xs font-semibold text-primary mb-2">Por que escolher a Nenos Food?</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {[
            "Zero mensalidade — pague só pela comissão",
            "Dashboard completo de pedidos e relatórios",
            "Entregadores verificados na sua região",
            "Presença em app com milhares de clientes",
          ].map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span className="text-primary">✓</span> {b}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary underline underline-offset-2">
          Entrar
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/signup" className="hover:underline">
          ← Escolher outro tipo de conta
        </Link>
      </p>
    </div>
  );
}
