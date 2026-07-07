import Link from "next/link";
import { Logo } from "@/components/shared/logo";

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

        <div className="relative space-y-5">
          <h1 className="text-4xl font-extrabold leading-tight">
            Rápido, fácil
            <br />
            <span className="text-secondary">e delicioso!</span>
          </h1>
          <p className="max-w-md text-lg text-white/85">
            A plataforma completa de delivery para restaurantes e clientes.
            Gerencie pedidos, cardápio e entregas em um só lugar.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {["🍕 Restaurantes", "🛵 Entregadores", "📱 Clientes"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm"
              >
                {item}
              </span>
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
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
