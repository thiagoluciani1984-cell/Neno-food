import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShoppingBag, Store, Bike } from "lucide-react";

export const metadata: Metadata = { title: "Criar conta" };

const OPTIONS = [
  {
    href: "/signup/customer",
    icon: ShoppingBag,
    title: "Quero pedir comida",
    description: "Crie sua conta de cliente e peça dos melhores restaurantes.",
  },
  {
    href: "/signup/restaurant",
    icon: Store,
    title: "Quero cadastrar meu restaurante",
    description: "Venda na plataforma — zero mensalidade, só comissão.",
  },
  {
    href: "/signup/driver",
    icon: Bike,
    title: "Quero ser entregador",
    description: "Entregue pedidos e ganhe com flexibilidade de horário.",
  },
];

export default function SignupChooserPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-serif text-2xl font-bold">Como você quer usar o Nenos Food?</h1>
        <p className="text-sm text-muted-foreground">Escolha o tipo de conta para começar.</p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border bg-white p-4 transition-colors hover:border-primary hover:bg-primary/5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
