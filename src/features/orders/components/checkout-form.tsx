"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Loader2,
  Tag,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { useCart } from "@/features/cart/use-cart";
import { createOrderAction, validateCouponAction } from "@/features/orders/actions";
import type { OrderType, PaymentMethod } from "@/types/database.types";

const PAYMENT_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType; description: string }> = {
  pix:    { label: "PIX",             icon: Smartphone, description: "Aprovação imediata" },
  cash:   { label: "Dinheiro",        icon: Banknote,   description: "Pague na entrega" },
  card:   { label: "Cartão",          icon: CreditCard, description: "Débito ou crédito na entrega" },
  online: { label: "Pagar online",    icon: Landmark,   description: "MercadoPago · cartão, PIX, boleto" },
};

interface CheckoutSettings {
  restaurantId: string;
  deliveryFeeCents: number;
  freeDeliveryAboveCents: number | null;
  minOrderCents: number;
  paymentMethods: PaymentMethod[];
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  defaultName: string;
  defaultPhone: string;
  isLoggedIn: boolean;
}

/* ── Botão de tipo de pedido / pagamento ──────────────────────── */
function SelectionButton({
  active, onClick, icon: Icon, label, description,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border hover:border-primary/40",
      ].join(" ")}
    >
      {Icon && <Icon className={["h-5 w-5 shrink-0", active ? "text-primary" : "text-muted-foreground"].join(" ")} />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

export function CheckoutForm({ settings }: { settings: CheckoutSettings }) {
  const router = useRouter();
  const { items, restaurantId: cartRestaurantId, subtotalCents, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [type, setType] = useState<OrderType>(
    settings.acceptsDelivery ? "delivery" : "pickup"
  );
  const [payment, setPayment] = useState<PaymentMethod>(
    settings.paymentMethods[0] ?? "pix"
  );
  const [name, setName] = useState(settings.defaultName);
  const [phone, setPhone] = useState(settings.defaultPhone);
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState<
    { state: "idle" } | { state: "valid"; discountCents: number; description: string } | { state: "invalid"; error: string }
  >({ state: "idle" });
  const [couponPending, startCouponTransition] = useTransition();

  const [address, setAddress] = useState({
    street: "", number: "", complement: "", district: "", city: "", state: "", zip: "", reference: "",
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = mounted ? subtotalCents() : 0;
  const deliveryFee = useMemo(() => {
    if (type !== "delivery") return 0;
    if (settings.freeDeliveryAboveCents != null && subtotal >= settings.freeDeliveryAboveCents) return 0;
    return settings.deliveryFeeCents;
  }, [type, subtotal, settings]);

  const discount = couponState.state === "valid" ? couponState.discountCents : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // ── CEP auto-fill ──────────────────────────────────────────────
  async function handleCEPBlur(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress((prev) => ({
          ...prev,
          street:   data.logradouro ?? prev.street,
          district: data.bairro     ?? prev.district,
          city:     data.localidade ?? prev.city,
          state:    data.uf         ?? prev.state,
        }));
        toast.success("Endereço preenchido automaticamente.");
      }
    } catch {
      // ignore
    } finally {
      setCepLoading(false);
    }
  }

  // ── Validar cupom ──────────────────────────────────────────────
  function handleValidateCoupon() {
    if (!coupon.trim()) return;
    startCouponTransition(async () => {
      const res = await validateCouponAction(coupon, settings.restaurantId, subtotal);
      if (res.valid) {
        setCouponState({ state: "valid", discountCents: res.discountCents, description: res.description });
        toast.success(`Cupom aplicado: ${res.description}`);
      } else {
        setCouponState({ state: "invalid", error: res.error });
        toast.error(res.error);
      }
    });
  }

  function removeCoupon() {
    setCoupon("");
    setCouponState({ state: "idle" });
  }

  if (mounted && items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <p className="text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild className="mt-4"><Link href="/">Ver cardápio</Link></Button>
      </div>
    );
  }

  async function handleSubmit() {
    if (!settings.isLoggedIn) {
      toast.error("Faça login para finalizar o pedido.");
      router.push("/login?redirect=/checkout");
      return;
    }
    if (subtotal < settings.minOrderCents) {
      toast.error(`Pedido mínimo de ${formatBRL(settings.minOrderCents)}.`);
      return;
    }
    if (type === "delivery") {
      const { street, number, district, city, state, zip } = address;
      if (!street || !number || !district || !city || !state || !zip) {
        toast.error("Preencha todos os campos do endereço.");
        return;
      }
    }

    const changeForCents =
      payment === "cash" && changeFor
        ? Math.round(parseFloat(changeFor.replace(",", ".")) * 100)
        : undefined;

    setSubmitting(true);
    const result = await createOrderAction({
      restaurantId: settings.restaurantId,
      type,
      paymentMethod: payment,
      customerName: name,
      customerPhone: phone,
      notes: notes || undefined,
      couponCode: couponState.state === "valid" ? coupon : undefined,
      changeForCents,
      address: type === "delivery" ? address : undefined,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, notes: i.notes })),
    });
    setSubmitting(false);

    if (result.ok) {
      clear();
      if (result.mpInitPoint) {
        window.location.href = result.mpInitPoint;
      } else {
        toast.success(`Pedido #${result.orderNumber} recebido!`);
        router.push(`/order/${result.orderId}`);
      }
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Finalizar pedido</h1>

      <div className="space-y-5">
        {/* ── Resumo do carrinho ───────────────────────────────── */}
        {mounted && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seu pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    <span className="mr-1.5 font-medium text-foreground">{item.quantity}×</span>
                    {item.name}
                  </span>
                  <span className="font-medium">{formatBRL(item.unitPriceCents * item.quantity)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Tipo de pedido ───────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Como deseja receber?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {settings.acceptsDelivery && (
              <SelectionButton active={type === "delivery"} onClick={() => setType("delivery")} label="Entrega" description="Receber em casa" />
            )}
            {settings.acceptsPickup && (
              <SelectionButton active={type === "pickup"} onClick={() => setType("pickup")} label="Retirar" description="No balcão" />
            )}
          </CardContent>
        </Card>

        {/* ── Dados de contato ─────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seus dados</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Telefone / WhatsApp</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </CardContent>
        </Card>

        {/* ── Endereço (delivery) ──────────────────────────────── */}
        {type === "delivery" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Endereço de entrega</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <div className="relative">
                  <Input
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                    onBlur={(e) => handleCEPBlur(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {cepLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Input value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} placeholder="123" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Rua</Label>
                <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Nome da rua" />
              </div>
              <div className="space-y-1.5">
                <Label>Complemento</Label>
                <Input value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} placeholder="Apto, bloco..." />
              </div>
              <div className="space-y-1.5">
                <Label>Bairro</Label>
                <Input value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} placeholder="Bairro" />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Cidade" />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="SP" maxLength={2} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Ponto de referência</Label>
                <Input value={address.reference} onChange={(e) => setAddress({ ...address, reference: e.target.value })} placeholder="Próximo ao..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Forma de pagamento ───────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settings.paymentMethods.map((m) => {
              const cfg = PAYMENT_CONFIG[m];
              return (
                <SelectionButton
                  key={m}
                  active={payment === m}
                  onClick={() => setPayment(m)}
                  icon={cfg.icon}
                  label={cfg.label}
                  description={cfg.description}
                />
              );
            })}
          </CardContent>
        </Card>

        {/* ── Troco ────────────────────────────────────────────── */}
        {payment === "cash" && (
          <Card>
            <CardContent className="pt-5 space-y-1.5">
              <Label>Troco para quanto? <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                inputMode="decimal"
                placeholder="Ex.: 50,00"
                value={changeFor}
                onChange={(e) => setChangeFor(e.target.value)}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Cupom + observações ───────────────────────────────── */}
        <Card>
          <CardContent className="space-y-4 pt-5">
            {/* Cupom */}
            <div className="space-y-1.5">
              <Label>Cupom de desconto</Label>
              {couponState.state === "valid" ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium">{coupon}</span>
                    <span className="text-muted-foreground">— {couponState.description}</span>
                  </div>
                  <button type="button" onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex.: BEMVINDO10"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponState({ state: "idle" }); }}
                    onKeyDown={(e) => e.key === "Enter" && handleValidateCoupon()}
                    className={couponState.state === "invalid" ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidateCoupon}
                    disabled={couponPending || !coupon.trim()}
                    className="shrink-0"
                  >
                    {couponPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
              {couponState.state === "invalid" && (
                <p className="text-xs text-destructive">{couponState.error}</p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Sem cebola, ponto da carne, alergia..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Resumo de valores ─────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Entrega</span>
              <span className={deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                {deliveryFee === 0 ? "Grátis" : formatBRL(deliveryFee)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Desconto</span>
                <span>−{formatBRL(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>

            {/* Aviso MercadoPago */}
            {payment === "online" && (
              <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                Você será redirecionado para o MercadoPago para concluir o pagamento com segurança.
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !mounted}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
              ) : payment === "online" ? (
                <>Pagar com MercadoPago <ChevronRight className="ml-1 h-4 w-4" /></>
              ) : (
                `Confirmar pedido · ${formatBRL(total)}`
              )}
            </Button>

            {!settings.isLoggedIn && (
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">Faça login</Link> para finalizar o pedido.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
