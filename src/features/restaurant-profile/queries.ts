import "server-only";
import { createClient } from "@/infra/supabase/server";

export interface RestaurantProfileData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  history: string | null;
  cuisine: string;
  establishment_type: string;
  price_range: number | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  logo_url: string | null;
  cover_url: string | null;
  chef_name: string | null;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
}

export async function getRestaurantProfile(
  restaurantId: string
): Promise<RestaurantProfileData | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select(
      "id,name,slug,description,history,cuisine,establishment_type,price_range,phone,email,whatsapp,instagram,website,logo_url,cover_url,chef_name,is_verified,avg_rating,total_reviews"
    )
    .eq("id", restaurantId)
    .single();

  return (data as RestaurantProfileData) ?? null;
}
