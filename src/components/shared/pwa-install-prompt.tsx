"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "nenos:pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint] = useState(() => isIos());
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    if (isStandalone()) return true;
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // navegador sem suporte ou falha silenciosa — instalação via prompt nativo ainda pode funcionar
      });
    }

    if (dismissed || showIosHint) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed, showIosHint]);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // storage bloqueado — sem problema, só não vai lembrar a dispensa
    }
    setDismissed(true);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setDeferredPrompt(null);
  }

  if (dismissed) return null;
  if (!showIosHint && !deferredPrompt) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-lg sm:inset-x-auto sm:right-4 sm:w-96">
      <div className="flex-1 text-sm">
        {showIosHint ? (
          <p>
            Instale o Nenos Food: toque em <Share className="inline h-3.5 w-3.5" /> e depois em{" "}
            <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
          </p>
        ) : (
          <>
            <p className="font-medium">Instalar o Nenos Food</p>
            <p className="text-muted-foreground">Acesso rápido, direto da tela inicial.</p>
          </>
        )}
      </div>
      {!showIosHint && (
        <Button size="sm" onClick={handleInstall}>
          <Download className="mr-1.5 h-4 w-4" />
          Instalar
        </Button>
      )}
      <button
        onClick={dismiss}
        aria-label="Fechar"
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
