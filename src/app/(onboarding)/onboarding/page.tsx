import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";

export default async function OnboardingPage() {
  const { profile } = await getSession();
  if (!profile) redirect("/login?redirect=/onboarding");

  // Se já tem restaurante, vai para o step atual
  if (profile.restaurant_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("registration_step, onboarding_status")
      .eq("id", profile.restaurant_id)
      .single();

    if (data?.onboarding_status === "in_review" || data?.onboarding_status === "approved") {
      redirect("/onboarding/aguardando");
    }
    redirect(`/onboarding/${data?.registration_step ?? 1}`);
  }

  redirect("/onboarding/1");
}
