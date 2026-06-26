import type { Metadata } from "next";
import { getActiveRestaurantId } from "@/features/auth/get-session";
import { createClient } from "@/infra/supabase/server";
import { CouponList } from "@/features/coupons/components/coupon-list";
import type { Coupon } from "@/types/database.types";

export const metadata: Metadata = { title: "Cupons" };

export default async function CouponsPage() {
  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) {
    return <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  return <CouponList coupons={(data ?? []) as Coupon[]} />;
}
