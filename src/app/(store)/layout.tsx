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

      <footer className="hidden border-t border-orange-100 bg-white py-10 md:block">
        <div className="container flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <p className="max-w-md text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Entrega rápida", "Restaurantes locais", "PIX e cartão"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/70">
            {siteConfig.tagline} · © {new Date().getFullYear()} Nenos Food
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary hover:underline">
              Privacidade
            </Link>
            <Link href="/terms" className="hover:text-primary hover:underline">
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
