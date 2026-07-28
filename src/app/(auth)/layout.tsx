import Image from "next/image";
import Link from "next/link";
import { Store, Bike, Users } from "lucide-react";
import { MobileAuthLogo } from "@/components/shared/mobile-auth-logo";

const FEATURES = [
  { icon: Store, title: "Para restaurantes", subtitle: "Gerencie seu negócio" },
  { icon: Bike, title: "Para entregadores", subtitle: "Entregue com facilidade" },
  { icon: Users, title: "Para clientes", subtitle: "Peça do seu jeito" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 nenos-gradient" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-secondary/40 blur-3xl" />
        <div className="absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
              🍔
            </span>
            <div className="leading-none">
              <span className="text-2xl font-extrabold text-white">nenos</span>
              <span className="block text-sm font-bold text-secondary">food</span>
            </div>
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-6">
          <div className="relative">
            <Image
              src="/brand/mascot/home-hero.png"
              alt=""
              width={360}
              height={360}
              className="relative z-10 h-auto w-full max-w-[340px] object-contain drop-shadow-2xl"
              priority
            />
            <div className="absolute inset-0 -z-0 rounded-full bg-white/10 blur-2xl" />
            <span className="absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-5 py-2 text-center shadow-xl">
              <span className="block text-lg font-black leading-none text-primary">
                nenos
              </span>
              <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">
                food
              </span>
            </span>
            <span className="absolute -right-4 top-4 rotate-6 text-3xl">🍕</span>
            <span className="absolute -left-2 top-16 -rotate-12 text-2xl">🍃</span>
            <span className="absolute right-2 bottom-16 rotate-12 text-2xl">❤️</span>
          </div>
        </div>

        <div className="relative space-y-5">
          <h1 className="text-4xl font-extrabold leading-tight">
            Rápido, fácil
            <br />
            <span className="text-secondary">e delicioso!</span>
          </h1>
          <p className="max-w-md text-white/85">
            A plataforma completa de delivery para restaurantes e clientes.
            Gerencie pedidos, cardápio e entregas em um só lugar.
          </p>
          <div className="space-y-2.5 pt-2">
            {FEATURES.map(({ icon: Icon, title, subtitle }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-xs text-white/70">{subtitle}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">
          © {new Date().getFullYear()} Nenos Food · Todos os direitos reservados
        </p>
      </div>

      <div className="flex items-center justify-center bg-[#FFF9F2] p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <MobileAuthLogo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
