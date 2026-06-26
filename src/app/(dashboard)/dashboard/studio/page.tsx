import type { Metadata } from "next";
import { getRestaurantImages, getNenosStudioImages } from "@/features/studio/queries";
import { StudioPage } from "@/features/studio/components/studio-page";

export const metadata: Metadata = {
  title: "Nenos Studio | Dashboard",
  description: "Biblioteca de imagens gastronômicas",
};

export default async function StudioPageRoute() {
  const [myImages, nenosImages] = await Promise.all([
    getRestaurantImages(),
    getNenosStudioImages(),
  ]);

  return <StudioPage myImages={myImages} nenosImages={nenosImages} />;
}
