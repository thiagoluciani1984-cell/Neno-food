-- Comissão da plataforma configurável por restaurante (fallback: env ASAAS_PLATFORM_FEE_PERCENT)
alter table public.restaurant_settings
  add column if not exists platform_fee_percent numeric(5,2);

comment on column public.restaurant_settings.platform_fee_percent is
  'Comissão da plataforma (%) sobre pedidos pagos online para este restaurante. Nulo = usa ASAAS_PLATFORM_FEE_PERCENT.';
