import type { Metadata } from "next";
import { RestaurantSignupForm } from "@/features/auth/components/restaurant-signup-form";

export const metadata: Metadata = {
  title: "Cadastre seu restaurante — Nenos Food",
  description: "Comece a vender na Nenos Food em 4 passos simples.",
};

export default function RestaurantSignupPage() {
  return <RestaurantSignupForm />;
}
