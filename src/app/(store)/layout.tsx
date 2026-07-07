import Link from "next/link";
import { Home, Search, Rss, User } from "lucide-react";
import { StoreHeaderShell } from "@/features/catalog/components/store-header-shell";
import { siteConfig } from "@/config/site";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f9]">
      <StoreHeaderShell />

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Footer — apenas desktop */}
      <footer className="hidden border-t bg-white py-8 md:block">
        <div className="container flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-base">🍔</span>
            <span className="text-lg font-extrabold text-primary">nenos</span>
            <span className="text-lg font-bold" style={{ color: "#FFB300" }}>food</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {siteConfig.tagline} · © {new Date().getFullYear()} Nenos Food
          </p>
          <p className="text-xs text-muted-foreground/60">
            Seu app de delivery favorito ♥
          </p>
        </div>
      </footer>

      {/* Bottom nav — apenas mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-white/95 backdrop-blur md:hidden">
        <BottomNavItem href="/" icon={<Home className="h-5 w-5" />} label="Início" />
        <BottomNavItem href="/?busca=1" icon={<Search className="h-5 w-5" />} label="Busca" />
        <BottomNavItem href="/feed" icon={<Rss className="h-5 w-5" />} label="Feed" />
        <BottomNavItem href="/account" icon={<User className="h-5 w-5" />} label="Conta" />
      </nav>
    </div>
  );
}

function BottomNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors hover:text-primary"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
