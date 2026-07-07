"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Loader2, QrCode, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { createClient } from "@/infra/supabase/client";
import type { OrderStatus } from "@/types/database.types";

interface PixPayload {
  qr_code?: string | null;
  qr_code_url?: string | null;
  expires_at?: string | null;
  mock?: boolean;
}

export function PixPaymentView({
  orderId,
  orderNumber,
  totalCents,
  initialStatus,
  pix,
}: {
  orderId: string;
  orderNumber: number;
  totalCents: number;
  initialStatus: OrderStatus;
  pix: PixPayload;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [copied, setCopied] = useState(false);
  const [mockPending, startMockTransition] = useTransition();

  useEffect(() => {
    if (status === "received" || status === "confirmed") {
      router.push(`/payment/success?order=${orderId}`);
      return;
    }
    if (status === "cancelled") {
      router.push(`/payment/failure?order=${orderId}`);
    }
  }, [orderId, router, status]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pix-payment-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = (payload.new as { status: OrderStatus }).status;
          setStatus(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (pix.mock || status !== "payment_pending") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/pagarme/sync?order=${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "paid" || data.orderStatus === "received") {
          setStatus("received");
        } else if (data.status === "failed") {
          setStatus("cancelled");
        }
      } catch {
        // ignore polling errors
      }
    };

    const interval = window.setInterval(poll, 8000);
    void poll();

    return () => window.clearInterval(interval);
  }, [orderId, pix.mock, status]);

  async function handleCopy() {
    if (!pix.qr_code) return;
    await navigator.clipboard.writeText(pix.qr_code);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMockConfirm() {
    startMockTransition(async () => {
      const res = await fetch("/api/payments/pagarme/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        toast.error("Não foi possível simular o pagamento.");
        return;
      }
      setStatus("received");
      toast.success("Pagamento simulado com sucesso!");
    });
  }

  return (
    <div className="container flex max-w-lg flex-col items-center gap-6 py-16 text-center">
      <div className="space-y-2">
        {pix.mock && (
          <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800">
            <FlaskConical className="h-3 w-3" />
            Modo desenvolvimento
          </Badge>
        )}
        <h1 className="text-2xl font-bold">Pague com PIX</h1>
        <p className="text-muted-foreground">
          Pedido #{orderNumber} · {formatBRL(totalCents)}
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          {pix.qr_code_url ? (
            <div className="rounded-xl border bg-white p-4">
              <Image
                src={pix.qr_code_url}
                alt="QR Code PIX"
                width={220}
                height={220}
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-xl border bg-muted">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {pix.qr_code && (
            <Button variant="outline" className="w-full" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copiado!" : "Copiar código PIX"}
            </Button>
          )}

          {pix.mock ? (
            <div className="w-full space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-4 text-left">
              <p className="text-sm text-amber-900">
                Sem chave Pagar.me configurada. Use o botão abaixo para simular
                a confirmação do PIX em desenvolvimento.
              </p>
              <Button
                className="w-full"
                onClick={handleMockConfirm}
                disabled={mockPending}
              >
                {mockPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simular pagamento aprovado
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguardando confirmação do pagamento...
            </div>
          )}

          {pix.expires_at && (
            <p className="text-xs text-muted-foreground">
              Expira em{" "}
              {new Date(pix.expires_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="ghost">
        <Link href={`/order/${orderId}`}>Ver status do pedido</Link>
      </Button>
    </div>
  );
}
