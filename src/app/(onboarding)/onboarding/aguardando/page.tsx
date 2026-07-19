import { redirect } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";
import { getSession } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default async function AguardandoPage() {
  const { profile } = await getSession();
  if (!profile) redirect("/login");

  let status = "in_review";
  if (profile.restaurant_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("onboarding_status, status")
      .eq("id", profile.restaurant_id)
      .single();
    status = (data?.onboarding_status as string) ?? "in_review";
    if (data?.status === "active") redirect("/dashboard");
  }

  if (status === "approved") redirect("/dashboard");
  if (status === "draft") redirect("/onboarding/1");

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <Image
        src="/brand/mascot/chef.webp"
        alt=""
        width={900}
        height={491}
        className="h-32 w-auto"
        priority
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Cadastro em análise!</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Recebemos seu cadastro e nossa equipe irá analisá-lo em até <strong>2 dias úteis</strong>.
        </p>
      </div>

      <div className="w-full rounded-2xl border bg-white p-5 text-left space-y-3">
        <h2 className="font-semibold">O que acontece agora?</h2>
        <div className="space-y-3">
          {[
            { icon: CheckCircle2, text: "Verificamos o seu CNPJ e dados cadastrais" },
            { icon: Mail, text: "Você receberá um e-mail com o resultado da análise" },
            { icon: CheckCircle2, text: "Após aprovação, seu restaurante fica ativo na plataforma" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Dúvidas? Entre em contato:{" "}
        <a href="mailto:suporte@nenos.app" className="font-medium text-primary underline underline-offset-2">
          suporte@nenos.app
        </a>
      </p>

      <Link href="/">
        <Button variant="outline">Voltar para o início</Button>
      </Link>
    </div>
  );
}
