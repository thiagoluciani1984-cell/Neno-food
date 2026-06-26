import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header simples */}
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm">🍔</span>
            <span className="text-base font-extrabold text-primary">nenos</span>
            <span className="text-base font-bold" style={{ color: "#FFB300" }}>food</span>
          </Link>
          <span className="text-sm text-muted-foreground">Cadastro de Restaurante</span>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name} · Seus dados são protegidos pela LGPD
      </footer>
    </div>
  );
}
