import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/infra/supabase/admin";
import type { Address } from "@/features/addresses/queries";

export const GUEST_CUSTOMER_COOKIE = "nenos_guest_id";
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

export interface GuestCustomer {
  fullName: string;
  phone: string;
}

/**
 * Lê o "crachá" salvo no navegador do convidado (se existir) e devolve seus
 * dados + endereços salvos, pra pré-preencher o checkout. Não expõe nada
 * a partir de telefone/CPF digitado — só reconhece o próprio navegador.
 */
export async function getGuestCheckoutDefaults(): Promise<{
  customer: GuestCustomer;
  addresses: Address[];
} | null> {
  const store = await cookies();
  const token = store.get(GUEST_CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  const supabase = createAdminClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .eq("guest_token", token)
    .is("profile_id", null)
    .maybeSingle<{ id: string; full_name: string | null; phone: string | null }>();

  if (!customer) return null;

  const { data: addresses } = await supabase
    .from("addresses")
    .select(
      "id, label, recipient, street, number, complement, district, city, state, zip, reference, is_default, created_at"
    )
    .eq("customer_id", customer.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return {
    customer: { fullName: customer.full_name ?? "", phone: customer.phone ?? "" },
    addresses: (addresses ?? []) as Address[],
  };
}

/**
 * Cria (1º pedido) ou reaproveita (pedidos seguintes, mesmo navegador) o
 * registro do cliente convidado, e renova o cookie que o reconhece.
 */
export async function upsertGuestCustomer(input: {
  fullName: string;
  phone: string;
}): Promise<{ customerId: string }> {
  const store = await cookies();
  const existingToken = store.get(GUEST_CUSTOMER_COOKIE)?.value;
  const supabase = createAdminClient();

  if (existingToken) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("guest_token", existingToken)
      .is("profile_id", null)
      .maybeSingle<{ id: string }>();

    if (existing) {
      await supabase
        .from("customers")
        .update({
          full_name: input.fullName,
          phone: input.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      store.set(GUEST_CUSTOMER_COOKIE, existingToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: GUEST_COOKIE_MAX_AGE,
        path: "/",
      });

      return { customerId: existing.id };
    }
  }

  const token = crypto.randomUUID();
  const { data: created, error } = await supabase
    .from("customers")
    .insert({ full_name: input.fullName, phone: input.phone, guest_token: token })
    .select("id")
    .single<{ id: string }>();

  if (error || !created) {
    throw new Error("Falha ao registrar cliente.");
  }

  store.set(GUEST_CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_COOKIE_MAX_AGE,
    path: "/",
  });

  return { customerId: created.id };
}

/** Salva o endereço da entrega pro cliente convidado, sem duplicar o mesmo endereço. */
export async function saveGuestAddress(
  customerId: string,
  address: {
    street: string;
    number: string;
    complement?: string | null;
    district: string;
    city: string;
    state: string;
    zip: string;
    reference?: string | null;
  }
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("customer_id", customerId)
    .eq("street", address.street)
    .eq("number", address.number)
    .eq("zip", address.zip)
    .maybeSingle<{ id: string }>();

  if (existing) return;

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId);

  await supabase.from("addresses").insert({
    customer_id: customerId,
    label: "Principal",
    street: address.street,
    number: address.number,
    complement: address.complement ?? null,
    district: address.district,
    city: address.city,
    state: address.state,
    zip: address.zip,
    reference: address.reference ?? null,
    is_default: (count ?? 0) === 0,
  });
}
