import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn("[mercadopago] MERCADOPAGO_ACCESS_TOKEN não configurado — pagamentos online desativados.");
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "TEST-placeholder",
  options: { timeout: 5000 },
});

export const mpPreference = new Preference(client);
export const mpPayment = new Payment(client);

export function isSandbox() {
  return (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").startsWith("TEST-");
}
