import "server-only";
import { createClient } from "@/infra/supabase/server";
import type { LaunchWheelSpin } from "@/types/database.types";
import { WHEEL_MAX_ORDERS } from "./constants";

export { WHEEL_SEGMENTS, WHEEL_MAX_ORDERS } from "./constants";

export interface WheelStatus {
  /** true enquanto o cliente ainda tem giros ou desconto ativo pra usar. */
  eligible: boolean;
  /** true só quando o cliente pode girar agora (não tem desconto pendente e não esgotou os 5). */
  canSpin: boolean;
  /** giro já sorteado e ainda não usado em um pedido, se existir. */
  activeSpin: LaunchWheelSpin | null;
  spinsUsed: number;
}

export async function getWheelStatus(customerId: string | null): Promise<WheelStatus> {
  if (!customerId) {
    return { eligible: false, canSpin: false, activeSpin: null, spinsUsed: 0 };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("launch_wheel_spins")
    .select("*")
    .eq("customer_id", customerId)
    .order("order_sequence", { ascending: true });

  const spins = (data ?? []) as LaunchWheelSpin[];
  const activeSpin = spins.find((s) => !s.order_id) ?? null;
  const spinsUsed = spins.length;
  const canSpin = !activeSpin && spinsUsed < WHEEL_MAX_ORDERS;
  const eligible = Boolean(activeSpin) || canSpin;

  return { eligible, canSpin, activeSpin, spinsUsed };
}
