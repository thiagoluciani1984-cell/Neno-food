import { z } from "zod";

const daySchema = z.object({
  enabled: z.boolean(),
  open: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
});

export const settingsSchema = z.object({
  // Operação
  is_open: z.boolean(),
  accepts_delivery: z.boolean(),
  accepts_pickup: z.boolean(),
  accepts_dine_in: z.boolean(),

  // Delivery
  delivery_fee_cents: z.number().int().min(0),
  free_delivery_above_cents: z.number().int().min(0).nullable(),
  min_order_cents: z.number().int().min(0),
  delivery_radius_km: z.number().min(0).max(100),
  avg_prep_minutes: z.number().int().min(1).max(180),

  // Pagamentos
  payment_methods: z
    .array(z.enum(["pix", "cash", "card", "online"]))
    .min(1, "Selecione pelo menos uma forma de pagamento"),

  // Horários
  opening_hours: z.object({
    dom: daySchema,
    seg: daySchema,
    ter: daySchema,
    qua: daySchema,
    qui: daySchema,
    sex: daySchema,
    sab: daySchema,
  }),

  // Endereço
  address_street: z.string().min(2, "Informe a rua").nullable(),
  address_number: z.string().min(1, "Informe o número").nullable(),
  address_district: z.string().min(2, "Informe o bairro").nullable(),
  address_city: z.string().min(2, "Informe a cidade").nullable(),
  address_state: z.string().length(2, "Use a sigla do estado (ex: SP)").nullable(),
  address_zip: z.string().min(8, "Informe o CEP").nullable(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const DAYS_LABELS: Record<string, string> = {
  dom: "Domingo",
  seg: "Segunda-feira",
  ter: "Terça-feira",
  qua: "Quarta-feira",
  qui: "Quinta-feira",
  sex: "Sexta-feira",
  sab: "Sábado",
};

export const DAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

export const DEFAULT_HOURS = {
  dom: { enabled: false, open: "11:00", close: "22:00" },
  seg: { enabled: true, open: "11:00", close: "22:00" },
  ter: { enabled: true, open: "11:00", close: "22:00" },
  qua: { enabled: true, open: "11:00", close: "22:00" },
  qui: { enabled: true, open: "11:00", close: "22:00" },
  sex: { enabled: true, open: "11:00", close: "23:00" },
  sab: { enabled: true, open: "11:00", close: "23:00" },
};
