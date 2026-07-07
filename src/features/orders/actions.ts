"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infra/supabase/server";
import { createAdminClient } from "@/infra/supabase/admin";
import { captureException } from "@/lib/monitoring";
import { computeCouponDiscountCents } from "@/core/domain/entities/cart";
import { canTransition } from "@/core/domain/value-objects/order-status";
import { notifyOrderStatusChange } from "@/features/notifications/lib";
import { ensureDeliveryCode } from "@/features/delivery/queries";
import {
  createPagarmeOrder,
  isPagarmeConfigured,
  isPagarmeDevMock,
  createMockPagarmePixOrder,
  createMockPagarmeCreditCardOrder,
} from "@/lib/payments";
import { checkoutSchema, type CheckoutInput } from "./schemas";
import { resolveCheckoutItemOptions } from "./validate-item-options";
import type { OptionGroupWithItems } from "@/features/catalog/queries-options";
import type {
  Coupon,
  OrderStatus,
  Product,
  RestaurantSettings,
} from "@/types/database.types";

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: number;
      paymentRedirect?: string;
      guestAccessToken?: string;
    }
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

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  const isGuest = !user;

  if (isGuest) {
    if (data.paymentMethod === "online") {
      return {
        ok: false,
        error: "Pagamento online exige login. Use PIX, dinheiro ou cartão na entrega.",
      };
    }
    if (!data.guestEmail?.trim()) {
      return { ok: false, error: "Informe seu e-mail para acompanhar o pedido." };
    }
  }

  const supabase = isGuest ? createAdminClient() : sessionClient;

  let customerId: string | null = null;
  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .single<{ id: string }>();
    if (!customer) return { ok: false, error: "Perfil de cliente não encontrado." };
    customerId = customer.id;
  }

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

  const { data: optionGroupsRaw } = await supabase
    .from("product_options")
    .select(
      "*, product_option_items(id, option_id, name, price_cents, is_available, sort_order, created_at, updated_at)"
    )
    .in("product_id", productIds);

  const optionGroupsByProduct = new Map<string, OptionGroupWithItems[]>();
  for (const group of optionGroupsRaw ?? []) {
    const productId = group.product_id as string;
    const list = optionGroupsByProduct.get(productId) ?? [];
    list.push({
      ...group,
      product_option_items: (
        Array.isArray(group.product_option_items)
          ? group.product_option_items
          : []
      ).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    } as OptionGroupWithItems);
    optionGroupsByProduct.set(productId, list);
  }

  let subtotal = 0;
  const orderItems: Array<{
    product_id: string;
    product_name: string;
    unit_price_cents: number;
    quantity: number;
    total_cents: number;
    notes: string | null;
    options: ReturnType<typeof resolveCheckoutItemOptions>["snapshots"];
  }> = [];

  try {
    for (const item of data.items) {
      const p = productMap.get(item.productId)!;
      if (!p.is_available || p.restaurant_id !== data.restaurantId) {
        return {
          ok: false,
          error: `Produto indisponível: ${p?.name ?? item.productId}`,
        };
      }

      const baseUnit = p.promo_price_cents ?? p.price_cents;
      const groups = optionGroupsByProduct.get(item.productId) ?? [];
      const { unitOptionsCents, snapshots } = resolveCheckoutItemOptions({
        productName: p.name,
        groups,
        selected: item.options ?? [],
      });

      const unit = baseUnit + unitOptionsCents;
      const itemTotal = unit * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        product_id: p.id,
        product_name: p.name,
        unit_price_cents: unit,
        quantity: item.quantity,
        total_cents: itemTotal,
        notes: item.notes ?? null,
        options: snapshots,
      });
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Opções inválidas.",
    };
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

  if (settings) {
    if (data.type === "delivery" && settings.accepts_delivery === false) {
      return { ok: false, error: "Este restaurante não aceita entrega." };
    }
    if (data.type === "pickup" && settings.accepts_pickup === false) {
      return { ok: false, error: "Este restaurante não aceita retirada." };
    }
    if (
      settings.payment_methods?.length &&
      !settings.payment_methods.includes(data.paymentMethod)
    ) {
      return { ok: false, error: "Forma de pagamento indisponível." };
    }
  }

  if (data.type === "delivery" && !data.address) {
    return { ok: false, error: "Informe o endereço de entrega." };
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
      if (coupon.per_customer_limit != null && customerId) {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customerId)
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

  if (isOnlinePayment) {
    if (!isPagarmeConfigured() && !isPagarmeDevMock()) {
      return { ok: false, error: "Pagamento online indisponível no momento." };
    }
    const document = data.customerDocument?.replace(/\D/g, "") ?? "";
    if (document.length !== 11) {
      return { ok: false, error: "Informe um CPF válido para pagamento online." };
    }
    if (!user?.email && !data.guestEmail) {
      return {
        ok: false,
        error: "Informe um e-mail para pagamento online.",
      };
    }
  }

  const payerEmail = user?.email ?? data.guestEmail!;

  // Cria pedido
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: data.restaurantId,
      customer_id: customerId,
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
    .select("id, order_number, guest_access_token")
    .single<{ id: string; order_number: number; guest_access_token: string | null }>();

  if (orderError || !order) {
    return { ok: false, error: "Não foi possível criar o pedido." };
  }

  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(
      orderItems.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name,
        unit_price_cents: i.unit_price_cents,
        quantity: i.quantity,
        total_cents: i.total_cents,
        notes: i.notes,
      }))
    )
    .select("id");

  if (itemsError || !insertedItems?.length) {
    return { ok: false, error: "Falha ao registrar itens do pedido." };
  }

  const optionRows = orderItems.flatMap((item, index) =>
    item.options.map((option) => ({
      order_item_id: insertedItems[index]!.id,
      option_id: option.option_id,
      option_item_id: option.option_item_id,
      option_name: option.option_name,
      option_item_name: option.option_item_name,
      unit_price_cents: option.unit_price_cents,
      quantity: option.quantity,
    }))
  );

  if (optionRows.length) {
    const { error: optionsError } = await supabase
      .from("order_item_options")
      .insert(optionRows);
    if (optionsError) {
      return { ok: false, error: "Falha ao registrar complementos do pedido." };
    }
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    method: data.paymentMethod,
    status: "pending",
    amount_cents: total,
    provider: isOnlinePayment ? "pagarme" : null,
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

  // ── Pagar.me: cria cobrança PIX ou cartão ─────────────────────────────
  if (isOnlinePayment) {
    try {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", data.restaurantId)
        .single<{ name: string }>();

      const paymentType = data.onlinePaymentType ?? "pix";

      const pagarmeResult = isPagarmeDevMock()
        ? paymentType === "pix"
          ? createMockPagarmePixOrder(order.id)
          : createMockPagarmeCreditCardOrder(order.id)
        : await createPagarmeOrder({
            orderId: order.id,
            orderNumber: order.order_number,
            restaurantName: restaurant?.name ?? "Nenos Food",
            restaurantRecipientId: settings?.pagarme_recipient_id ?? null,
            totalCents: total,
            items: orderItems.map((item) => ({
              productId: item.product_id,
              name: item.product_name,
              quantity: item.quantity,
              unitPriceCents: item.unit_price_cents,
            })),
            customer: {
              name: data.customerName,
              email: payerEmail,
              document: data.customerDocument!,
              phone: data.customerPhone,
            },
            paymentType,
          });

      const providerPayload =
        pagarmeResult.type === "pix"
          ? {
              type: "pix",
              qr_code: pagarmeResult.data.qrCode,
              qr_code_url: pagarmeResult.data.qrCodeUrl,
              expires_at: pagarmeResult.data.expiresAt,
              ...(isPagarmeDevMock() ? { mock: true } : {}),
            }
          : {
              type: "credit_card",
              checkout_url: pagarmeResult.data.checkoutUrl,
            };

      await supabase
        .from("payments")
        .update({
          provider_ref: pagarmeResult.data.chargeId,
          provider_payload: providerPayload,
        })
        .eq("order_id", order.id);

      revalidatePath("/dashboard/orders");

      const paymentRedirect =
        pagarmeResult.type === "pix"
          ? `/payment/pix?order=${order.id}`
          : pagarmeResult.data.checkoutUrl ?? `/payment/pending?order=${order.id}`;

      return {
        ok: true,
        orderId: order.id,
        orderNumber: order.order_number,
        paymentRedirect,
        guestAccessToken: isGuest ? order.guest_access_token ?? undefined : undefined,
      };
    } catch (err) {
      captureException(err, { orderId: order.id, context: "pagarme-checkout" });
      await supabase
        .from("orders")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", order.id);
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro ao iniciar pagamento online. Tente outro método.",
      };
    }
  }

  revalidatePath("/dashboard/orders");
  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number,
    guestAccessToken: isGuest ? order.guest_access_token ?? undefined : undefined,
  };
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

  if (nextStatus === "out_for_delivery") {
    await ensureDeliveryCode(orderId, supabase);
  }

  await notifyOrderStatusChange(orderId, nextStatus);

  revalidatePath("/dashboard/orders");
  return { ok: true };
}
