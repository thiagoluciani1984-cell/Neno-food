"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "nenos:signup-promo-dismissed-until";
const DISMISS_DAYS = 3;

/**
 * Aparece pra visitante não logado, anunciando a roleta de desconto e
 * convidando a criar conta — fechável, nunca bloqueia a navegação.
 */
const BLOCKED_PATH_PREFIXES = ["/checkout", "/cart", "/order", "/payment", "/account"];

function isBlockedPathname(pathname: string): boolean {
  return BLOCKED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function SignupPromoModal({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const isBlockedPath = isBlockedPathname(pathname);

  // Lido uma vez, na montagem — no servidor (sem window) fica "dispensado"
  // por padrão, então não aparece piscando antes da hidratação. Em
  // navegadores que bloqueiam storage (Safari com cookies bloqueados,
  // modos de privacidade restritos), getItem pode lançar — nesse caso
  // também trata como "dispensado" em vez de quebrar a página inteira.
  const [dismissedByStorage] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const dismissedUntil = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
      return Date.now() < dismissedUntil;
    } catch {
      return true;
    }
  });
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  const open = !isLoggedIn && !isBlockedPath && !dismissedByStorage && !manuallyDismissed;

  function dismiss() {
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      window.localStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      // storage bloqueado — sem problema, só não vai lembrar a dispensa
    }
    setManuallyDismissed(true);
  }

  if (isLoggedIn || isBlockedPath) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl">Crie sua conta e gire a roleta!</DialogTitle>
          <DialogDescription className="text-center">
            Clientes com conta ganham um desconto de <strong>10% a 50% OFF</strong> em
            cada um dos 5 primeiros pedidos. É rápido e grátis.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link href="/signup/customer" onClick={dismiss}>
              Criar conta grátis
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            Continuar sem conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
