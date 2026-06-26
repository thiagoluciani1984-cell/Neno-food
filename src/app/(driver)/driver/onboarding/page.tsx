import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { getDriverProfile } from "@/features/driver/queries";
import { OnboardingForm } from "@/features/driver/components/onboarding-form";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = { title: "Cadastro de entregador" };

export default async function DriverOnboardingPage() {
  const { user } = await getSession();
  if (!user) redirect("/login?redirect=/driver/onboarding");

  const driver = await getDriverProfile(user.id);
  if (!driver) redirect("/signup/driver");

  // Se já aprovado, vai direto pro portal
  if (driver.approval_status === "approved") redirect("/driver");

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <header className="flex h-16 items-center border-b bg-white px-6">
        <Logo />
      </header>

      <main className="container max-w-lg py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Complete seu cadastro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha as informações abaixo para começar a entregar.
          </p>
        </div>

        <OnboardingForm driver={driver} />
      </main>
    </div>
  );
}
