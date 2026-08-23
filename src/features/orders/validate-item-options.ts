import type { OptionGroupWithItems } from "@/features/catalog/queries-options";

export interface CheckoutItemOptionInput {
  optionId: string;
  optionItemId: string;
  quantity: number;
}

export interface ResolvedItemOption {
  option_id: string;
  option_item_id: string;
  option_name: string;
  option_item_name: string;
  unit_price_cents: number;
  quantity: number;
}

/**
 * Calcula o preço final de um item a partir do preço base do produto e das
 * opções escolhidas. Grupos "sum" (padrão) somam o preço da opção ao preço
 * base — ex: borda recheada +R$8. Grupos "max_price" SUBSTITUEM o preço
 * base pelo preço da opção mais cara escolhida no grupo — ex: pizza meio a
 * meio, onde o cliente escolhe dois sabores e paga o valor do mais caro.
 */
export function resolveCheckoutItemOptions(params: {
  productName: string;
  basePriceCents: number;
  groups: OptionGroupWithItems[];
  selected: CheckoutItemOptionInput[];
}): { unitPriceCents: number; snapshots: ResolvedItemOption[] } {
  const { productName, basePriceCents, groups, selected } = params;
  const snapshots: ResolvedItemOption[] = [];

  const selectedByGroup = new Map<string, CheckoutItemOptionInput[]>();
  for (const entry of selected) {
    const group = groups.find((g) => g.id === entry.optionId);
    if (!group) {
      throw new Error(`Opção inválida em ${productName}.`);
    }

    const optionItem = group.product_option_items.find(
      (item) => item.id === entry.optionItemId
    );
    if (!optionItem || !optionItem.is_available) {
      throw new Error(`Complemento indisponível em ${productName}.`);
    }

    const list = selectedByGroup.get(group.id) ?? [];
    list.push(entry);
    selectedByGroup.set(group.id, list);
  }

  let sumAdditionsCents = 0;
  let maxPriceOverrideCents: number | null = null;

  for (const group of groups) {
    const picks = selectedByGroup.get(group.id) ?? [];
    const totalQty = picks.reduce((sum, p) => sum + p.quantity, 0);

    if (group.is_required && totalQty < Math.max(1, group.min_qty)) {
      throw new Error(`Selecione ${group.name} em ${productName}.`);
    }

    if (totalQty > group.max_qty) {
      throw new Error(`Limite de ${group.name} excedido em ${productName}.`);
    }

    if (group.type === "single" && picks.length > 1) {
      throw new Error(`Escolha apenas uma opção em ${group.name}.`);
    }

    let groupMaxCents = 0;
    for (const pick of picks) {
      const optionItem = group.product_option_items.find(
        (item) => item.id === pick.optionItemId
      )!;
      snapshots.push({
        option_id: group.id,
        option_item_id: optionItem.id,
        option_name: group.name,
        option_item_name: optionItem.name,
        unit_price_cents: optionItem.price_cents,
        quantity: pick.quantity,
      });

      if (group.pricing_mode === "max_price") {
        groupMaxCents = Math.max(groupMaxCents, optionItem.price_cents);
      } else {
        sumAdditionsCents += optionItem.price_cents * pick.quantity;
      }
    }

    if (group.pricing_mode === "max_price" && picks.length > 0) {
      maxPriceOverrideCents = Math.max(maxPriceOverrideCents ?? 0, groupMaxCents);
    }
  }

  const unitPriceCents = (maxPriceOverrideCents ?? basePriceCents) + sumAdditionsCents;

  return { unitPriceCents, snapshots };
}
