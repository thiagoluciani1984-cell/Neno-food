"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/infra/supabase/server";
import { getActiveRestaurantId } from "@/features/auth/get-session";

const couponSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z.string().min(3, "Código muito curto"),
    type: z.enum(["percentage", "fixed", "free_shipping"]),
    valuePercent: z.coerce.number().min(0).max(100).nullable().optional(),
    valueCents: z.coerce.number().int().nonnegative().default(0),
    minOrderCents: z.coerce.number().int().nonnegative().default(0),
    usageLimit: z.coerce.number().int().nonnegative().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (d) => d.type !== "percentage" || (d.valuePercent ?? 0) > 0,
    { message: "Informe o percentual de desconto", path: ["valuePercent"] }
  );

export type CouponInput = z.infer<typeof couponSchema>;

export async function saveCouponAction(
  input: CouponInput
): Promise<{ ok: boolean; error?: string }> {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message };

  const restaurantId = await getActiveRestaurantId();
  if (!restaurantId) return { ok: false, error: "Restaurante não identificado." };

  const supabase = await createClient();
  const payload = {
    restaurant_id: restaurantId,
    code: parsed.data.code.toUpperCase(),
    type: parsed.data.type,
    value_percent: parsed.data.type === "percentage" ? parsed.data.valuePercent : null,
    value_cents: parsed.data.type === "fixed" ? parsed.data.valueCents : 0,
    min_order_cents: parsed.data.minOrderCents,
    usage_limit: parsed.data.usageLimit ?? null,
    expires_at: parsed.data.expiresAt || null,
    is_active: parsed.data.isActive,
  };

  const query = parsed.data.id
    ? supabase.from("coupons").update(payload).eq("id", parsed.data.id)
    : supabase.from("coupons").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/coupons");
  return { ok: true };
}

export async function deleteCouponAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/coupons");
  return { ok: true };
}
