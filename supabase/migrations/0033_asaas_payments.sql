-- Migração do gateway de pagamento: Pagar.me → Asaas
alter table public.restaurant_settings
  drop column if exists pagarme_recipient_id;

alter table public.restaurant_settings
  add column if not exists asaas_wallet_id text;

comment on column public.restaurant_settings.asaas_wallet_id is
  'walletId da subconta Asaas do restaurante, usado no split de pagamento';
