import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { StepIndicator } from "@/features/onboarding/components/step-indicator";
import { Step1Form } from "@/features/onboarding/components/step1-form";
import { Step2Form } from "@/features/onboarding/components/step2-form";
import { Step3Form } from "@/features/onboarding/components/step3-form";
import { Step4Review } from "@/features/onboarding/components/step4-review";

const STEP_META = [
  { step: 1, title: "Seu negócio",            subtitle: "Vamos começar com as informações básicas do seu estabelecimento." },
  { step: 2, title: "Contato e endereço",     subtitle: "Como os clientes vão te encontrar?" },
  { step: 3, title: "Dados jurídicos",        subtitle: "Precisamos verificar a regularidade do seu negócio." },
  { step: 4, title: "Revisão e envio",        subtitle: "Confira tudo antes de enviar para análise." },
];

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: stepParam } = await params;
  const stepNum = parseInt(stepParam, 10);

  if (isNaN(stepNum) || stepNum < 1 || stepNum > 4) notFound();

  const { profile } = await getSession();
  if (!profile) redirect("/login?redirect=/onboarding");

  // Dados atuais do restaurante (se existir)
  let restaurant: Record<string, unknown> | null = null;
  let settings: Record<string, unknown> | null = null;

  if (profile.restaurant_id) {
    const supabase = await createClient();

    const { data: rest } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", profile.restaurant_id)
      .single();

    if (rest) {
      // Redireciona se status não permite edição
      if (rest.onboarding_status === "in_review" || rest.onboarding_status === "approved") {
        redirect("/onboarding/aguardando");
      }
      restaurant = rest as Record<string, unknown>;
    }

    const { data: sett } = await supabase
      .from("restaurant_settings")
      .select("*")
      .eq("restaurant_id", profile.restaurant_id)
      .single();

    if (sett) settings = sett as Record<string, unknown>;
  }

  const meta = STEP_META[stepNum - 1];

  return (
    <div className="space-y-6">
      {/* Progresso */}
      <StepIndicator current={stepNum} />

      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold">{meta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {stepNum === 1 && (
          <Step1Form
            defaultName={(restaurant?.name as string) ?? ""}
            defaultSlug={(restaurant?.slug as string) ?? ""}
          />
        )}

        {stepNum === 2 && (
          <Step2Form
            defaults={{
              phone:              (restaurant?.phone as string) ?? "",
              whatsapp:           (restaurant?.whatsapp as string) ?? "",
              email:              (restaurant?.email as string) ?? "",
              instagram:          (restaurant?.instagram as string) ?? "",
              website:            (restaurant?.website as string) ?? "",
              address_street:     (settings?.address_street as string) ?? "",
              address_number:     (settings?.address_number as string) ?? "",
              address_complement: (settings?.address_complement as string) ?? "",
              address_district:   (settings?.address_district as string) ?? "",
              address_city:       (settings?.address_city as string) ?? "",
              address_state:      (settings?.address_state as string) ?? "",
              address_zip:        (settings?.address_zip as string) ?? "",
              avg_prep_minutes:   (settings?.avg_prep_minutes as number) ?? 40,
            }}
          />
        )}

        {stepNum === 3 && (
          <Step3Form
            defaults={{
              cnpj:      (restaurant?.cnpj as string) ?? "",
              chef_name: (restaurant?.chef_name as string) ?? "",
              history:   (restaurant?.history as string) ?? "",
            }}
          />
        )}

        {stepNum === 4 && restaurant && (
          <Step4Review
            data={{
              name:               (restaurant.name as string) ?? "",
              cuisine:            (restaurant.cuisine as string) ?? "",
              establishment_type: (restaurant.establishment_type as string) ?? "",
              city:               (settings?.address_city as string) ?? "–",
              state:              (settings?.address_state as string) ?? "–",
              cnpj:               (restaurant.cnpj as string) ?? "–",
              chef_name:          (restaurant.chef_name as string) ?? "–",
            }}
          />
        )}

        {stepNum === 4 && !restaurant && (
          <p className="text-sm text-muted-foreground">
            Volte ao <Link href="/onboarding/1" className="font-medium text-primary underline">passo 1</Link> para começar o cadastro.
          </p>
        )}
      </div>

      {/* Navegação de volta */}
      {stepNum > 1 && (
        <div className="text-center">
          <Link
            href={`/onboarding/${stepNum - 1}`}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            ← Voltar
          </Link>
        </div>
      )}
    </div>
  );
}
