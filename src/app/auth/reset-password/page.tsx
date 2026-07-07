import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF9F2] p-6">
      <div className="w-full max-w-sm rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">Carregando...</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
