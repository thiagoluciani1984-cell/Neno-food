-- =====================================================================
-- 0051 · Modo de preço do grupo de opções: além de "somar" (padrão, ex:
--        borda recheada +R$8), um grupo pode ser "max_price" — o preço
--        final do item vira o preço da opção MAIS CARA escolhida no
--        grupo, substituindo o preço base do produto. Caso de uso:
--        pizza meio a meio — o cliente escolhe dois sabores e paga o
--        valor do sabor mais caro dos dois, não a soma.
-- =====================================================================

create type public.option_pricing_mode as enum ('sum', 'max_price');

alter table public.product_options
  add column pricing_mode public.option_pricing_mode not null default 'sum';

comment on column public.product_options.pricing_mode is
  'sum = soma o preco de cada opcao escolhida no preco base do produto (padrao). max_price = o preco final do item vira o preco da opcao MAIS CARA escolhida no grupo, substituindo o preco base (ex: pizza meio a meio).';
