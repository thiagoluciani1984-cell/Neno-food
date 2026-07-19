import { Suspense } from "react";
import Link from "next/link";
import { StoreHeaderShell } from "@/features/catalog/components/store-header-shell";
import { StoreBottomNav } from "@/components/shared/store-bottom-nav";
import { StorePageMotion } from "@/components/shared/store-page-motion";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF9F2]">
      <StoreHeaderShell />

      <main className="flex-1 pb-24 md:pb-0">
        <StorePageMotion>{children}</StorePageMotion>
      </main>

      <footer className="hidden bg-[#171717] py-12 md:block">
        <div className="container flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <p className="max-w-md text-sm text-white/70">
            {siteConfig.description}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Entrega rápida", "Restaurantes locais", "PIX e cartão"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-white/40">
            {siteConfig.tagline} · © {new Date().getFullYear()} Nenos Food
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/60">
            <Link href="/privacy" className="transition-colors hover:text-primary hover:underline">
              Privacidade
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary hover:underline">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        <StoreBottomNav />
      </Suspense>
    </div>
  );
}
