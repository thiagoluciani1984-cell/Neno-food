import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-xl">🍔</span>
          <div>
            <span className="text-xl font-extrabold text-white">nenos</span>
            <span className="text-xl font-bold" style={{ color: "#FFB300" }}>food</span>
          </div>
        </Link>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Rápido, fácil
            <br />
            <span style={{ color: "#FFB300" }}>e delicioso!</span>
          </h1>
          <p className="max-w-md text-primary-foreground/80 text-lg">
            A plataforma completa de delivery para restaurantes e clientes.
            Gerencie pedidos, cardápio e entregas em um só lugar.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {["🍕 Restaurantes", "🛵 Entregadores", "📱 Clientes"].map((item) => (
              <span key={item} className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Nenos Food · Todos os direitos reservados
        </p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <Link href="/" className="mb-8 flex items-center gap-1.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-base">🍔</span>
            <span className="text-lg font-extrabold text-primary">nenos</span>
            <span className="text-lg font-bold" style={{ color: "#FFB300" }}>food</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
