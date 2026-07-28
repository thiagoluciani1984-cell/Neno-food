import { NextRequest, NextResponse } from "next/server";
import { getOrderStatusForTracking } from "@/features/orders/queries";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Reforço de polling pro acompanhamento do pedido — cobre o caso do
 * cliente convidado, cuja sessão de Realtime não recebe updates (RLS
 * de `orders` não reconhece o token de convidado, só customer_id logado).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`order-status:${ip}`, 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? undefined;

  const order = await getOrderStatusForTracking(id, token);
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
