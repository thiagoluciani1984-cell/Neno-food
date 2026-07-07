-- Pagar.me: recipient por restaurante + payload do gateway no pagamento
alter table public.restaurant_settings
  add column if not exists pagarme_recipient_id text;

alter table public.payments
  add column if not exists provider_payload jsonb;

comment on column public.restaurant_settings.pagarme_recipient_id is
  'ID do recebedor Pagar.me (rp_...) para split de pagamento do restaurante';

comment on column public.payments.provider_payload is
  'Dados extras do gateway (ex.: QR Code PIX, URL de checkout)';

-- Habilita PIX online nos restaurantes ativos
update public.restaurant_settings
set payment_methods = payment_methods || 'online'::public.payment_method
where not 'online'::public.payment_method = any (payment_methods);
