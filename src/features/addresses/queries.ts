import "server-only";
import { createClient } from "@/infra/supabase/server";

export type Address = {
  id: string;
  label: string;
  recipient: string | null;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zip: string;
  reference: string | null;
  is_default: boolean;
  created_at: string;
};

export async function getCustomerAddresses(customerId: string): Promise<Address[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("addresses")
    .select(
      "id, label, recipient, street, number, complement, district, city, state, zip, reference, is_default, created_at"
    )
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return (data ?? []) as Address[];
}
