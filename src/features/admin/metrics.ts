import "server-only";
import { createAdminClient } from "@/infra/supabase/admin";
import type { OrderStatus, PaymentMethod } from "@/types/database.types";

const WELCOME_COUPON_CODES = ["BEMVINDO15", "FRETEGRATIS1"];
const DELIVERY_MIX_MIN_SAMPLE = 5;

interface RawOrder {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  coupon_id: string | null;
  total_cents: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  customer_phone: string | null;
  created_at: string;
}

// Vercel roda em UTC — sem isso, pedidos feitos nas últimas ~3h do mês
// (horário de Brasília) caem no "mês seguinte" nas métricas, distorcendo
// o gatilho de expansão (250 pedidos x 2 meses) bem na margem de cada mês.
const SAO_PAULO_UTC_OFFSET_HOURS = 3; // UTC-3, sem horário de verão desde 2019

function getSaoPauloYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1;
  return { year, month };
}

function monthBounds(offsetMonths: number) {
  const { year, month } = getSaoPauloYearMonth(new Date());
  const start = new Date(Date.UTC(year, month + offsetMonths, 1, SAO_PAULO_UTC_OFFSET_HOURS, 0, 0));
  const end = new Date(Date.UTC(year, month + offsetMonths + 1, 1, SAO_PAULO_UTC_OFFSET_HOURS, 0, 0));
  return { start, end };
}

function inRange(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr);
  return d >= start && d < end;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface MonthSnapshot {
  orders: number;
  gmvCents: number;
  avgTicketCents: number;
}

export interface MonthlyOverview {
  current: MonthSnapshot;
  previous: MonthSnapshot;
  ordersChangePct: number | null;
  gmvChangePct: number | null;
  avgTicketChangePct: number | null;
}

export interface PaymentMixRow {
  restaurantId: string;
  restaurantName: string;
  ordersLast30d: number;
  onlinePct: number;
  deliveryPct: number;
  alertHighDelivery: boolean;
}

export interface RestaurantRevenueRow {
  restaurantId: string;
  restaurantName: string;
  feePercent: number;
  onlineGmvCents: number;
  revenueCents: number;
}

export interface PlatformRevenue {
  currentMonthCents: number;
  previousMonthCents: number;
  byRestaurant: RestaurantRevenueRow[];
}

export interface RestaurantRatingRow {
  restaurantId: string;
  restaurantName: string;
  avgRating: number;
  totalReviews: number;
  belowThreshold: boolean;
}

export interface CouponAcquisition {
  totalAllTime: number;
  currentMonth: number;
  previousMonth: number;
}

export interface RepeatPurchase {
  loggedInRatePct: number | null;
  loggedInBase: number;
  guestRatePct: number | null;
  guestBase: number;
  guestIsApproximate: true;
}

export interface PhaseTriggers {
  ordersCurrentMonth: number;
  ordersPreviousMonth: number;
  volumeTriggerMet: boolean;
  weightedAvgRating: number | null;
  ratingTriggerMet: boolean;
}

export interface AdminBusinessMetrics {
  monthlyOverview: MonthlyOverview;
  paymentMix: PaymentMixRow[];
  platformRevenue: PlatformRevenue;
  ratings: RestaurantRatingRow[];
  couponAcquisition: CouponAcquisition;
  repeatPurchase: RepeatPurchase;
  phaseTriggers: PhaseTriggers;
}

export async function getAdminBusinessMetrics(): Promise<AdminBusinessMetrics> {
  const supabase = createAdminClient();

  const [{ data: restaurants }, { data: settingsRows }, { data: orders }, { data: coupons }] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select("id, name, avg_rating, total_reviews")
        .eq("status", "active"),
      supabase
        .from("restaurant_settings")
        .select("restaurant_id, platform_fee_percent"),
      supabase
        .from("orders")
        .select(
          "id, restaurant_id, customer_id, coupon_id, total_cents, status, payment_method, customer_phone, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase.from("coupons").select("id, code").in("code", WELCOME_COUPON_CODES),
    ]);

  const restaurantList = restaurants ?? [];
  const feeByRestaurant = new Map<string, number | null>(
    (settingsRows ?? []).map((s) => [s.restaurant_id, s.platform_fee_percent])
  );
  const allOrders = (orders ?? []) as RawOrder[];
  const validOrders = allOrders.filter((o) => o.status !== "cancelled");
  const welcomeCouponIds = new Set((coupons ?? []).map((c) => c.id));
  const envFeeFallback = Number(process.env.ASAAS_PLATFORM_FEE_PERCENT ?? "10");

  // ── 1. Visão mensal ──────────────────────────────────────────────
  const curMonth = monthBounds(0);
  const prevMonth = monthBounds(-1);

  function snapshot(start: Date, end: Date): MonthSnapshot {
    const rows = validOrders.filter((o) => inRange(o.created_at, start, end));
    const gmvCents = rows.reduce((s, o) => s + o.total_cents, 0);
    return {
      orders: rows.length,
      gmvCents,
      avgTicketCents: rows.length ? Math.round(gmvCents / rows.length) : 0,
    };
  }

  const current = snapshot(curMonth.start, curMonth.end);
  const previous = snapshot(prevMonth.start, prevMonth.end);
  const monthlyOverview: MonthlyOverview = {
    current,
    previous,
    ordersChangePct: pctChange(current.orders, previous.orders),
    gmvChangePct: pctChange(current.gmvCents, previous.gmvCents),
    avgTicketChangePct: pctChange(current.avgTicketCents, previous.avgTicketCents),
  };

  // ── 2. Mix de pagamento por restaurante (últimos 30 dias) ────────
  const last30dStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last30dEnd = new Date();
  const paymentMix: PaymentMixRow[] = restaurantList.map((r) => {
    const rows = validOrders.filter(
      (o) => o.restaurant_id === r.id && inRange(o.created_at, last30dStart, last30dEnd)
    );
    const online = rows.filter((o) => o.payment_method === "online").length;
    const total = rows.length;
    const deliveryPct = total ? ((total - online) / total) * 100 : 0;
    return {
      restaurantId: r.id,
      restaurantName: r.name,
      ordersLast30d: total,
      onlinePct: total ? (online / total) * 100 : 0,
      deliveryPct,
      alertHighDelivery: total >= DELIVERY_MIX_MIN_SAMPLE && deliveryPct > 80,
    };
  });

  // ── 3. Receita da plataforma (comissão sobre pagamento online) ───
  function revenueForRange(start: Date, end: Date) {
    let total = 0;
    const byRestaurant: RestaurantRevenueRow[] = restaurantList.map((r) => {
      const rows = validOrders.filter(
        (o) =>
          o.restaurant_id === r.id &&
          o.payment_method === "online" &&
          inRange(o.created_at, start, end)
      );
      const onlineGmvCents = rows.reduce((s, o) => s + o.total_cents, 0);
      const feePercent = feeByRestaurant.get(r.id) ?? envFeeFallback;
      const revenueCents = Math.round(onlineGmvCents * (feePercent / 100));
      total += revenueCents;
      return {
        restaurantId: r.id,
        restaurantName: r.name,
        feePercent,
        onlineGmvCents,
        revenueCents,
      };
    });
    return { total, byRestaurant };
  }

  const curRevenue = revenueForRange(curMonth.start, curMonth.end);
  const prevRevenue = revenueForRange(prevMonth.start, prevMonth.end);
  const platformRevenue: PlatformRevenue = {
    currentMonthCents: curRevenue.total,
    previousMonthCents: prevRevenue.total,
    byRestaurant: curRevenue.byRestaurant,
  };

  // ── 4. Nota média por restaurante ────────────────────────────────
  const ratings: RestaurantRatingRow[] = restaurantList
    .map((r) => ({
      restaurantId: r.id,
      restaurantName: r.name,
      avgRating: r.avg_rating,
      totalReviews: r.total_reviews,
      belowThreshold: r.total_reviews > 0 && r.avg_rating < 4.5,
    }))
    .sort((a, b) => a.avgRating - b.avgRating);

  // ── 5. Clientes novos via cupom de boas-vindas ───────────────────
  const couponOrders = allOrders.filter(
    (o) => o.coupon_id && welcomeCouponIds.has(o.coupon_id)
  );
  const couponAcquisition: CouponAcquisition = {
    totalAllTime: couponOrders.length,
    currentMonth: couponOrders.filter((o) => inRange(o.created_at, curMonth.start, curMonth.end))
      .length,
    previousMonth: couponOrders.filter((o) =>
      inRange(o.created_at, prevMonth.start, prevMonth.end)
    ).length,
  };

  // ── 6. Recompra ───────────────────────────────────────────────────
  const customerIds = [...new Set(allOrders.map((o) => o.customer_id).filter(Boolean))] as string[];
  const { data: customers } = await supabase
    .from("customers")
    .select("id, profile_id")
    .in("id", customerIds.length ? customerIds : ["00000000-0000-0000-0000-000000000000"]);
  const profileIdByCustomer = new Map(
    (customers ?? []).map((c) => [c.id, c.profile_id as string | null])
  );

  const loggedOrderCounts = new Map<string, number>();
  const guestOrderCounts = new Map<string, number>();
  for (const o of allOrders) {
    if (!o.customer_id) continue;
    const profileId = profileIdByCustomer.get(o.customer_id);
    if (profileId) {
      loggedOrderCounts.set(o.customer_id, (loggedOrderCounts.get(o.customer_id) ?? 0) + 1);
    } else {
      const phoneKey = (o.customer_phone ?? "").replace(/\D/g, "");
      if (!phoneKey) continue;
      guestOrderCounts.set(phoneKey, (guestOrderCounts.get(phoneKey) ?? 0) + 1);
    }
  }

  function repeatRate(counts: Map<string, number>) {
    const base = counts.size;
    if (base === 0) return { ratePct: null as number | null, base: 0 };
    const repeaters = [...counts.values()].filter((c) => c >= 2).length;
    return { ratePct: (repeaters / base) * 100, base };
  }

  const loggedRepeat = repeatRate(loggedOrderCounts);
  const guestRepeat = repeatRate(guestOrderCounts);
  const repeatPurchase: RepeatPurchase = {
    loggedInRatePct: loggedRepeat.ratePct,
    loggedInBase: loggedRepeat.base,
    guestRatePct: guestRepeat.ratePct,
    guestBase: guestRepeat.base,
    guestIsApproximate: true,
  };

  // ── 7. Gatilhos de fase ───────────────────────────────────────────
  const totalReviewsSum = restaurantList.reduce((s, r) => s + r.total_reviews, 0);
  const weightedAvgRating = totalReviewsSum
    ? restaurantList.reduce((s, r) => s + r.avg_rating * r.total_reviews, 0) / totalReviewsSum
    : null;

  const phaseTriggers: PhaseTriggers = {
    ordersCurrentMonth: current.orders,
    ordersPreviousMonth: previous.orders,
    volumeTriggerMet: current.orders >= 250 && previous.orders >= 250,
    weightedAvgRating,
    ratingTriggerMet: weightedAvgRating !== null && weightedAvgRating >= 4.5,
  };

  return {
    monthlyOverview,
    paymentMix,
    platformRevenue,
    ratings,
    couponAcquisition,
    repeatPurchase,
    phaseTriggers,
  };
}
