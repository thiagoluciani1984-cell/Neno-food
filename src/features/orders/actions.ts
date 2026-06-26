"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { computeCouponDiscountCents } from "@/core/domain/entities/cart";
import { canTransition } from "@/core/domain/value-objects/order-status";
import { mpPreference, isSandbox } from "@/lib/mercadopago";
import { checkoutSchema, type CheckoutInput } from "./schemas";
import type {
  Coupon,
  OrderStatus,
  Product,
  RestaurantSettings,
} from "@/types/database.types";

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: number; mpInitPoint?: string }
  | { ok: false; error: string };

export type CouponPreview =
  | { valid: true; discountCents: number; description: string }
  | { valid: false; error: string };

export async function validateCouponAction(
  code: string,
  restaurantId: string,
  subtotalCents: number
): Promise<CouponPreview> {
  if (!code.trim()) return { valid: false, error: "Código vazio." };

  const supabase = await createClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle<Coupon>();

  if (!coupon) return { valid: false, error: "Cupom inválido ou expirado." };
  if (subtotalCents < coupon.min_order_cents)
    return { valid: false, error: `Pedido mínimo de R$ ${(coupon.min_order_cents / 100).toFixed(2).replace(".", ",")} para este cupom.` };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { valid: false, error: "Cupom expirado." };
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
    return { valid: false, error: "Cupom esgotado." };

  const discountCents = computeCouponDiscountCents({
    type: coupon.type,
    valuePercent: coupon.value_percent,
    valueCents: coupon.value_cents,
    maxDiscountCents: coupon.max_discount_cents,
    subtotalCents,
    deliveryFeeCents: 0,
  });

  const description =
    coupon.type === "percentage"
      ? `${coupon.value_percent}% de desconto`
      : coupon.type === "fixed"
      ? `R$ ${(coupon.value_cents / 100).toFixed(2).replace(".", ",")} de desconto`
      : "Frete grátis";

  return { valid: true, discountCents, description };
}

/**
 * Cria um pedido. REGRA CRÍTICA: preços e descontos são recalculados no
 * servidor a partir do banco — nunca confiamos nos valores do cliente.
 */
export async function createOrderAction(
  input: CheckoutInput
): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login para finalizar o pedido." };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!customer) return { ok: false, error: "Perfil de cliente não encontrado." };

  // Preços confiáveis do banco
  const productIds = data.items.map((i) => i.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, promo_price_cents, is_available, restaurant_id")
    .in("id", productIds);

  if (!products || products.length !== productIds.length) {
    return { ok: false, error: "Um ou mais produtos são inválidos." };
  }

  const productMap = new Map(products.map((p) => [p.id, p as Product]));
  let subtotal = 0;
  const orderItems: Array<{
    product_id: string;
    product_name: string;
    unit_price_cents: number;
    quantity: number;
    total_cents: number;
    notes: string | null;
  }> = [];

  for (const item of data.items) {
    const p = productMap.get(item.productId)!;
    if (!p.is_available || p.restaurant_id !== data.restaurantId) {
      return { ok: false, error: `Produto indisponível: ${p?.name ?? item.productId}` };
    }
    const unit = p.promo_price_cents ?? p.price_cents;
    const itemTotal = unit * item.quantity;
    subtotal += itemTotal;
    orderItems.push({
      product_id: p.id,
      product_name: p.name,
      unit_price_cents: unit,
      quantity: item.quantity,
      total_cents: itemTotal,
      notes: item.notes ?? null,
    });
  }

  // Configurações do restaurante (taxa de entrega / pedido mínimo)
  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("restaurant_id", data.restaurantId)
    .maybeSingle<RestaurantSettings>();

  if (settings && subtotal < settings.min_order_cents) {
    return { ok: false, error: "Pedido abaixo do valor mínimo." };
  }

  let deliveryFee = 0;
  if (data.type === "delivery" && settings) {
    const freeAbove = settings.free_delivery_above_cents;
    deliveryFee =
      freeAbove != null && subtotal >= freeAbove ? 0 : settings.delivery_fee_cents;
  }

  // Cupom (validação server-side)
  let discount = 0;
  let couponId: string | null = null;
  let appliedCoupon: Coupon | null = null;
  if (data.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("restaurant_id", data.restaurantId)
      .eq("code", data.couponCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle<Coupon>();

    if (coupon && subtotal >= coupon.min_order_cents) {
      const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
      const underLimit = coupon.usage_limit == null || coupon.used_count < coupon.usage_limit;

      let underPerCustomerLimit = true;
      if (coupon.per_customer_limit != null) {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customer.id)
          .eq("coupon_id", coupon.id);
        underPerCustomerLimit = (count ?? 0) < coupon.per_customer_limit;
      }

      if (notExpired && underLimit && underPerCustomerLimit) {
        discount = computeCouponDiscountCents({
          type: coupon.type,
          valuePercent: coupon.value_percent,
          valueCents: coupon.value_cents,
          maxDiscountCents: coupon.max_discount_cents,
          subtotalCents: subtotal,
          deliveryFeeCents: deliveryFee,
        });
        couponId = coupon.id;
        appliedCoupon = coupon;
      }
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);

  const isOnlinePayment = data.paymentMethod === "online";

  // Cria pedido
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: data.restaurantId,
      customer_id: customer.id,
      coupon_id: couponId,
      type: data.type,
      status: (isOnlinePayment ? "payment_pending" : "received") as OrderStatus,
      payment_method: data.paymentMethod,
      payment_status: "pending",
      delivery_address: data.type === "delivery" ? data.address ?? null : null,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      notes: data.notes ?? null,
      subtotal_cents: subtotal,
      delivery_fee_cents: deliveryFee,
      discount_cents: discount,
      total_cents: total,
      change_for_cents: data.changeForCents ?? null,
    })
    .select("id, order_number")
    .single<{ id: string; order_number: number }>();

  if (orderError || !order) {
    return { ok: false, error: "Não foi possível criar o pedido." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((i) => ({ ...i, order_id: order.id }))
  );
  if (itemsError) {
    return { ok: false, error: "Falha ao registrar itens do pedido." };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    method: data.paymentMethod,
    status: "pending",
    amount_cents: total,
    provider: isOnlinePayment ? "mercadopago" : null,
  });
  if (paymentError) {
    return { ok: false, error: "Falha ao registrar pagamento. Tente novamente." };
  }

  if (couponId && appliedCoupon) {
    await supabase
      .from("coupons")
      .update({ used_count: appliedCoupon.used_count + 1 })
      .eq("id", couponId);
  }

  // ── MercadoPago: cria preferência e retorna URL de pagamento ──────────
  if (isOnlinePayment) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", data.restaurantId)
        .single<{ name: string }>();

      const pref = await mpPreference.create({
        body: {
          external_reference: order.id,
          statement_descriptor: restaurant?.name ?? "Nenos Food",
          items: orderItems.map((item) => ({
            id: item.product_id,
            title: item.product_name,
            quantity: item.quantity,
            unit_price: parseFloat((item.unit_price_cents / 100).toFixed(2)),
            currency_id: "BRL",
          })),
          payer: { name: data.customerName },
          back_urls: {
            success: `${siteUrl}/payment/success?order=${order.id}`,
            failure: `${siteUrl}/payment/failure?order=${order.id}`,
            pending: `${siteUrl}/payment/pending?order=${order.id}`,
          },
          auto_return: "approved",
          notification_url: `${siteUrl}/api/mercadopago/webhook`,
        },
      });

      const mpInitPoint = isSandbox()
        ? pref.sandbox_init_point
        : pref.init_point;

      if (pref.id) {
        await supabase
          .from("payments")
          .update({ provider_ref: pref.id })
          .eq("order_id", order.id);
      }

      revalidatePath("/dashboard/orders");
      return { ok: true, orderId: order.id, orderNumber: order.order_number, mpInitPoint: mpInitPoint ?? undefined };
    } catch (err) {
      console.error("[mercadopago] preference error:", err);
      return { ok: false, error: "Erro ao iniciar pagamento online. Tente outro método." };
    }
  }

  revalidatePath("/dashboard/orders");
  return { ok: true, orderId: order.id, orderNumber: order.order_number };
}

/**
 * Altera o status de um pedido respeitando a máquina de estados.
 * Usado pelo painel do restaurante (KDS).
 */
export async function updateOrderStatusAction(
  orderId: string,
  nextStatus: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single<{ status: OrderStatus }>();

  if (!current) return { ok: false, error: "Pedido não encontrado." };
  if (!canTransition(current.status, nextStatus)) {
    return { ok: false, error: "Transição de status inválida." };
  }

  const timestamps: Partial<Record<string, string>> = {};
  const now = new Date().toISOString();
  if (nextStatus === "confirmed") timestamps.confirmed_at = now;
  if (nextStatus === "ready") timestamps.ready_at = now;
  if (nextStatus === "delivered") timestamps.delivered_at = now;
  if (nextStatus === "cancelled") timestamps.cancelled_at = now;

  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus, ...timestamps })
    .eq("id", orderId);

  if (error) return { ok: false, error: "Falha ao atualizar status." };

  revalidatePath("/dashboard/orders");
  return { ok: true };
}
