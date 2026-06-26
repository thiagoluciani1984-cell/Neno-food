"use server";

import { getProductOptions } from "./queries-options";
import type { OptionGroupWithItems } from "./queries-options";

export async function fetchProductOptionsAction(productId: string): Promise<OptionGroupWithItems[]> {
  return getProductOptions(productId);
}
