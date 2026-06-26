import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, TrendingUp, Bike, AlertCircle } from "lucide-react";
import { getSession } from "@/features/auth/get-session";
import { logoutAction } from "@/features/auth/actions";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/core/domain/value-objects/order-status";
import {
  getDriverProfile,
  getAvailableOrders,
  getActiveDelivery,
  getDriverDeliveryHistory,
} from "@/features/driver/queries";
import { DriverStatusToggle } from "@/features/driver/components/driver-status-toggle";
import { ActiveOrderCard } from "@/features/driver/components/active-order-card";
import { AvailableOrderCard } from "@/features/driver/components/available-order-card";

export const metadata: Metadata = { title: "Portal do Entregador" };

export default async function DriverPage() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login?redirect=/driver");

  const driver = await getDriverProfile(user.id);
  if (!driver) redirect("/signup/driver");

  // Verificar se o onboarding foi preenchido
  const hasPersonal = !!driver.cpf;
  const hasVehicle = !!driver.vehicle;
  const hasDocs = driver.documents.length >= 2;
  if (!hasPersonal || !hasVehicle || !hasDocs) redirect("/driver/onboarding");

  const isApproved = driver.approval_status === "approved";
  const isOnline = driver.status === "available" || driver.status === "busy";

  const [availableOrders, activeOrder, history] = await Promise.all([
    isApproved && driver.status === "available"
      ? getAvailableOrders()
      : Promise.resolve([]),
    isApproved ? getActiveDelivery(driver.id) : Promise.resolve(null),
    getDriverDeliveryHistory(driver.id, 10),
  ]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {profile?.full_name?.split(" ")[0]}
          </span>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="container max-w-2xl space-y-6 py-8">
        {/* Aviso de aprovação pendente */}
        {!isApproved && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {driver.approval_status === "pending"
                  ? "Cadastro em análise"
                  : driver.approval_status === "rejected"
                    ? "Cadastro recusado"
                    : "Conta suspensa"}
              </p>
              <p className="text-xs text-amber-700">
                {driver.approval_status === "pending"
                  ? "Nosso time está analisando seus documentos. Geralmente leva até 24h úteis."
                  : driver.rejection_reason ??
                    driver.suspension_reason ??
                    "Entre em contato com o suporte."}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Bike className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{driver.total_deliveries}</p>
              <p className="text-xs text-muted-foreground">Entregas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto mb-1 h-5 w-5 text-green-500" />
              <p className="text-lg font-bold">
                {formatBRL(driver.total_earnings_cents)}
              </p>
              <p className="text-xs text-muted-foreground">Ganhos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{history.length}</p>
              <p className="text-xs text-muted-foreground">Recentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Toggle online/offline */}
        <DriverStatusToggle
          currentStatus={driver.status as "offline" | "available" | "busy"}
          approvalStatus={driver.approval_status}
        />

        {/* Entrega ativa */}
        {activeOrder && (
          <div>
            <h2 className="mb-3 font-semibold">Entrega atual</h2>
            <ActiveOrderCard order={activeOrder} />
          </div>
        )}

        {/* Pedidos disponíveis */}
        {isApproved && driver.status === "available" && !activeOrder && (
          <div>
            <h2 className="mb-3 font-semibold">
              Pedidos disponíveis
              {availableOrders.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {availableOrders.length}
                </span>
              )}
            </h2>
            {availableOrders.length === 0 ? (
              <div className="rounded-xl border bg-white py-10 text-center">
                <Bike className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Nenhum pedido disponível no momento.
                </p>
                <p className="text-xs text-muted-foreground">Fique online e aguarde!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map((order) => (
                  <AvailableOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Offline sem entrega ativa */}
        {isApproved && !isOnline && !activeOrder && (
          <div className="rounded-xl border bg-white py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Fique online para ver e aceitar pedidos.
            </p>
          </div>
        )}

        {/* Histórico */}
        {history.length > 0 && (
          <div>
            <h2 className="mb-3 font-semibold">Últimas entregas</h2>
            <div className="space-y-2">
              {history.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium">#{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.delivered_at
                        ? new Date(o.delivered_at).toLocaleString("pt-BR")
                        : new Date(o.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={ORDER_STATUS_COLOR[o.status]}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {formatBRL(o.delivery_fee_cents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
