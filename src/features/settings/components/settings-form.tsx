"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/money";
import { saveSettingsAction, toggleOpenAction } from "@/features/settings/actions";
import {
  type SettingsInput,
  DAY_KEYS,
  DAYS_LABELS,
  DEFAULT_HOURS,
} from "@/features/settings/schemas";
import type { RestaurantSettings, PaymentMethod } from "@/types/database.types";
import {
  ESTABLISHMENT_TYPE_OPTIONS,
  type EstablishmentType,
} from "@/core/domain/value-objects/establishment-type";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "pix", label: "PIX", icon: "💠" },
  { value: "cash", label: "Dinheiro", icon: "💵" },
  { value: "card", label: "Cartão na entrega", icon: "💳" },
  { value: "online", label: "Pagamento online", icon: "🌐" },
];

function centsToReal(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
function realToCents(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

export function SettingsForm({
  initial,
  restaurant,
  pagarmeConfigured = false,
  pagarmeDevMock = false,
}: {
  initial: RestaurantSettings | null;
  restaurant: { cuisine: string; establishment_type: EstablishmentType };
  pagarmeConfigured?: boolean;
  pagarmeDevMock?: boolean;
}) {
  const hours =
    (initial?.opening_hours as SettingsInput["opening_hours"]) ?? DEFAULT_HOURS;

  const [form, setForm] = useState<SettingsInput>({
    establishment_type: restaurant.establishment_type,
    cuisine: restaurant.cuisine,
    is_open: initial?.is_open ?? false,
    accepts_delivery: initial?.accepts_delivery ?? true,
    accepts_pickup: initial?.accepts_pickup ?? false,
    accepts_dine_in: initial?.accepts_dine_in ?? false,
    delivery_fee_cents: initial?.delivery_fee_cents ?? 500,
    free_delivery_above_cents: initial?.free_delivery_above_cents ?? null,
    min_order_cents: initial?.min_order_cents ?? 2000,
    delivery_radius_km: initial?.delivery_radius_km ?? 5,
    avg_prep_minutes: initial?.avg_prep_minutes ?? 30,
    payment_methods: (initial?.payment_methods as PaymentMethod[]) ?? ["pix", "cash", "card"],
    opening_hours: hours,
    address_street: initial?.address_street ?? null,
    address_number: initial?.address_number ?? null,
    address_district: initial?.address_district ?? null,
    address_city: initial?.address_city ?? null,
    address_state: initial?.address_state ?? null,
    address_zip: initial?.address_zip ?? null,
    pagarme_recipient_id: initial?.pagarme_recipient_id ?? null,
  });

  const [saving, setSaving] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);

  function set<K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePayment(method: PaymentMethod) {
    const current = form.payment_methods;
    if (current.includes(method)) {
      if (current.length === 1) return; // mínimo 1
      set("payment_methods", current.filter((m) => m !== method));
    } else {
      set("payment_methods", [...current, method]);
    }
  }

  function setHour(
    day: keyof SettingsInput["opening_hours"],
    field: "enabled" | "open" | "close",
    value: boolean | string
  ) {
    setForm((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: { ...prev.opening_hours[day], [field]: value },
      },
    }));
  }

  async function handleToggleOpen() {
    setTogglingOpen(true);
    const next = !form.is_open;
    const res = await toggleOpenAction(next);
    setTogglingOpen(false);
    if (res.ok) {
      set("is_open", next);
      toast.success(next ? "Restaurante aberto!" : "Restaurante fechado.");
    } else {
      toast.error(res.error);
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await saveSettingsAction(form);
    setSaving(false);
    if (res.ok) {
      toast.success("Configurações salvas com sucesso!");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com toggle rápido */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie horários, entrega e formas de pagamento do seu restaurante.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={form.is_open ? "outline" : "default"}
            className={form.is_open ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
            onClick={handleToggleOpen}
            disabled={togglingOpen}
          >
            {togglingOpen ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Power className="mr-2 h-4 w-4" />
            )}
            {form.is_open ? "Aberto agora" : "Fechado agora"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar tudo
          </Button>
        </div>
      </div>

      {/* Categoria do restaurante */}
      <Card>
        <CardHeader>
          <CardTitle>Categoria do restaurante</CardTitle>
          <CardDescription>
            Usada nos filtros de busca do marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de estabelecimento</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ESTABLISHMENT_TYPE_OPTIONS.map((t) => (
                <label
                  key={t.value}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:font-semibold"
                >
                  <input
                    type="radio"
                    name="establishment_type"
                    value={t.value}
                    checked={form.establishment_type === t.value}
                    onChange={() => set("establishment_type", t.value)}
                    className="accent-primary"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="cuisine">Tipo de culinária</Label>
            <Input
              id="cuisine"
              value={form.cuisine}
              onChange={(e) => set("cuisine", e.target.value)}
              placeholder="Ex: Italiana, Brasileira, Árabe..."
              maxLength={80}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de atendimento */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de atendimento</CardTitle>
          <CardDescription>Defina como os clientes podem fazer pedidos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            id="accepts_delivery"
            label="Delivery"
            description="Clientes pedem com entrega em casa"
            checked={form.accepts_delivery}
            onCheckedChange={(v) => set("accepts_delivery", v)}
          />
          <Separator />
          <SwitchRow
            id="accepts_pickup"
            label="Retirada no balcão"
            description="Cliente retira no local sem taxa de entrega"
            checked={form.accepts_pickup}
            onCheckedChange={(v) => set("accepts_pickup", v)}
          />
          <Separator />
          <SwitchRow
            id="accepts_dine_in"
            label="Comer no local (Dine-in)"
            description="Pedidos feitos na mesa pelo cardápio digital"
            checked={form.accepts_dine_in}
            onCheckedChange={(v) => set("accepts_dine_in", v)}
          />
        </CardContent>
      </Card>

      {/* Taxas e limites */}
      <Card>
        <CardHeader>
          <CardTitle>Entrega e pedido mínimo</CardTitle>
          <CardDescription>
            Valores em reais. Deixe &ldquo;Frete grátis acima de&rdquo; em branco para não aplicar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Taxa de entrega (R$)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={centsToReal(form.delivery_fee_cents)}
              onChange={(e) => set("delivery_fee_cents", realToCents(e.target.value))}
              placeholder="5,00"
            />
            <p className="text-xs text-muted-foreground">
              Atual: {formatBRL(form.delivery_fee_cents)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Frete grátis acima de (R$)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={
                form.free_delivery_above_cents != null
                  ? centsToReal(form.free_delivery_above_cents)
                  : ""
              }
              onChange={(e) =>
                set(
                  "free_delivery_above_cents",
                  e.target.value === "" ? null : realToCents(e.target.value)
                )
              }
              placeholder="Não aplicar"
            />
          </div>

          <div className="space-y-2">
            <Label>Pedido mínimo (R$)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={centsToReal(form.min_order_cents)}
              onChange={(e) => set("min_order_cents", realToCents(e.target.value))}
              placeholder="20,00"
            />
            <p className="text-xs text-muted-foreground">
              Atual: {formatBRL(form.min_order_cents)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Raio de entrega (km)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={form.delivery_radius_km}
              onChange={(e) => set("delivery_radius_km", Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tempo médio de preparo (min)</Label>
            <Input
              type="number"
              min={1}
              max={180}
              value={form.avg_prep_minutes}
              onChange={(e) => set("avg_prep_minutes", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Formas de pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Formas de pagamento aceitas</CardTitle>
          <CardDescription>Selecione todas que seu restaurante aceita.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = form.payment_methods.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePayment(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagar.me (split de pagamento)</CardTitle>
          <CardDescription>
            ID do recebedor para receber automaticamente sua parte dos pedidos online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              pagarmeConfigured
                ? "border-green-200 bg-green-50 text-green-800"
                : pagarmeDevMock
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-muted bg-muted/40 text-muted-foreground"
            }`}
          >
            {pagarmeConfigured
              ? "Pagar.me conectado — PIX online ativo."
              : pagarmeDevMock
                ? "Modo desenvolvimento (PAGARME_DEV_MOCK) — pagamentos simulados."
                : "Pagar.me não configurado — adicione PAGARME_SECRET_KEY no servidor."}
          </div>
          <div className="space-y-2">
            <Label>Recipient ID</Label>
          <Input
            value={form.pagarme_recipient_id ?? ""}
            onChange={(e) =>
              set("pagarme_recipient_id", e.target.value.trim() || null)
            }
            placeholder="rp_xxxxxxxxxxxxxxxx"
          />
          <p className="text-xs text-muted-foreground">
            Encontre em dashboard.pagar.me → Recebedores. Deixe vazio se ainda não configurou.
          </p>
          </div>
        </CardContent>
      </Card>

      {/* Horários de funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle>Horários de funcionamento</CardTitle>
          <CardDescription>
            Configure os dias e horários em que o restaurante aceita pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAY_KEYS.map((day) => {
            const h = form.opening_hours[day];
            return (
              <div
                key={day}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex w-36 items-center gap-2">
                  <Switch
                    id={`day-${day}`}
                    checked={h.enabled}
                    onCheckedChange={(v) => setHour(day, "enabled", v)}
                  />
                  <Label
                    htmlFor={`day-${day}`}
                    className={`text-sm font-medium ${h.enabled ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {DAYS_LABELS[day]}
                  </Label>
                </div>

                {h.enabled ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={h.open}
                      onChange={(e) => setHour(day, "open", e.target.value)}
                      className="h-8 w-28 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={h.close}
                      onChange={(e) => setHour(day, "close", e.target.value)}
                      className="h-8 w-28 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Fechado</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço do restaurante</CardTitle>
          <CardDescription>Aparece no perfil público do restaurante.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="col-span-2 space-y-2">
            <Label>Rua / Avenida</Label>
            <Input
              value={form.address_street ?? ""}
              onChange={(e) => set("address_street", e.target.value || null)}
              placeholder="Rua das Flores"
            />
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input
              value={form.address_number ?? ""}
              onChange={(e) => set("address_number", e.target.value || null)}
              placeholder="123"
            />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input
              value={form.address_district ?? ""}
              onChange={(e) => set("address_district", e.target.value || null)}
              placeholder="Centro"
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              value={form.address_city ?? ""}
              onChange={(e) => set("address_city", e.target.value || null)}
              placeholder="São Paulo"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>UF</Label>
              <Input
                value={form.address_state ?? ""}
                onChange={(e) =>
                  set("address_state", e.target.value.toUpperCase().slice(0, 2) || null)
                }
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={form.address_zip ?? ""}
                onChange={(e) => set("address_zip", e.target.value || null)}
                placeholder="01001-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão salvar final */}
      <div className="flex justify-end pb-6">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
