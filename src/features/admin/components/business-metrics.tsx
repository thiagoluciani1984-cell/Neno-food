import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import type { AdminBusinessMetrics } from "@/features/admin/metrics";

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">sem base</span>;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-green-600" : "text-destructive"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function BusinessMetrics({ metrics }: { metrics: AdminBusinessMetrics }) {
  const { monthlyOverview, paymentMix, platformRevenue, ratings, couponAcquisition, repeatPurchase, phaseTriggers } =
    metrics;

  return (
    <div className="space-y-6">
      {/* ── Visão mensal ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-bold">Visão do mês</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pedidos</p>
              <p className="text-xl font-bold">{monthlyOverview.current.orders}</p>
              <ChangeBadge pct={monthlyOverview.ordersChangePct} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">GMV</p>
              <p className="text-xl font-bold">{formatBRL(monthlyOverview.current.gmvCents)}</p>
              <ChangeBadge pct={monthlyOverview.gmvChangePct} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-xl font-bold">{formatBRL(monthlyOverview.current.avgTicketCents)}</p>
              <ChangeBadge pct={monthlyOverview.avgTicketChangePct} />
            </CardContent>
          </Card>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Mês anterior: {monthlyOverview.previous.orders} pedidos · {formatBRL(monthlyOverview.previous.gmvCents)} ·
          ticket {formatBRL(monthlyOverview.previous.avgTicketCents)}. Exclui pedidos cancelados.
        </p>
      </section>

      {/* ── Mix de pagamento ─────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-bold">Mix de pagamento por restaurante</h2>
        <p className="mb-2 text-xs text-muted-foreground">Últimos 30 dias.</p>
        <div className="space-y-2">
          {paymentMix.map((row) => (
            <Card key={row.restaurantId}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">{row.restaurantName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.ordersLast30d} pedidos · {row.onlinePct.toFixed(0)}% online / {row.deliveryPct.toFixed(0)}% na entrega
                  </p>
                </div>
                {row.alertHighDelivery && (
                  <Badge variant="destructive">+80% na entrega — pagamento online não está pegando</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Receita da plataforma ────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-bold">Receita da plataforma</h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comissão sobre pedidos pagos online (mês atual)</CardTitle>
            <CardDescription>
              Bruta — não desconta a taxa da Asaas por transação. Pedido pago na entrega não gera receita.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">{formatBRL(platformRevenue.currentMonthCents)}</p>
            <p className="text-xs text-muted-foreground">
              Mês anterior: {formatBRL(platformRevenue.previousMonthCents)}
            </p>
            <div className="space-y-1 border-t pt-2">
              {platformRevenue.byRestaurant.map((r) => (
                <div key={r.restaurantId} className="flex justify-between text-sm">
                  <span>{r.restaurantName} <span className="text-xs text-muted-foreground">({r.feePercent}%)</span></span>
                  <span className="font-medium">{formatBRL(r.revenueCents)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Notas por restaurante ────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-bold">Nota média por restaurante</h2>
        <div className="space-y-2">
          {ratings.map((r) => (
            <Card key={r.restaurantId}>
              <CardContent className="flex items-center justify-between p-4">
                <span className="font-medium">{r.restaurantName}</span>
                <div className="flex items-center gap-2">
                  <span className={r.belowThreshold ? "font-bold text-destructive" : "font-bold"}>
                    ★ {r.avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">({r.totalReviews} avaliações)</span>
                  {r.belowThreshold && <Badge variant="destructive">abaixo de 4,5</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Aquisição via cupom + Recompra ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clientes novos via cupom de boas-vindas</CardTitle>
            <CardDescription>BEMVINDO15 / FRETEGRATIS1</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{couponAcquisition.currentMonth}</p>
            <p className="text-xs text-muted-foreground">
              este mês · {couponAcquisition.previousMonth} mês anterior · {couponAcquisition.totalAllTime} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recompra (2+ pedidos)</CardTitle>
            <CardDescription>Desde o início</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xl font-bold">
                {repeatPurchase.loggedInRatePct !== null ? `${repeatPurchase.loggedInRatePct.toFixed(0)}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">clientes logados ({repeatPurchase.loggedInBase} na base)</p>
            </div>
            <div>
              <p className="text-xl font-bold text-muted-foreground">
                {repeatPurchase.guestRatePct !== null ? `${repeatPurchase.guestRatePct.toFixed(0)}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                convidados ({repeatPurchase.guestBase} na base) — aproximado por telefone, não 100% confiável
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Gatilhos de fase ─────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-bold">Gatilhos de expansão</h2>
        <div className="space-y-2">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">250 pedidos/mês por 2 meses consecutivos</p>
                <p className="text-xs text-muted-foreground">
                  Atual: {phaseTriggers.ordersCurrentMonth} · anterior: {phaseTriggers.ordersPreviousMonth}
                </p>
              </div>
              <Badge variant={phaseTriggers.volumeTriggerMet ? "default" : "secondary"}>
                {phaseTriggers.volumeTriggerMet ? "Atingido" : "Ainda não"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">Nota média geral ≥ 4,5</p>
                <p className="text-xs text-muted-foreground">
                  Atual: {phaseTriggers.weightedAvgRating !== null ? phaseTriggers.weightedAvgRating.toFixed(2) : "sem avaliações"}
                </p>
              </div>
              <Badge variant={phaseTriggers.ratingTriggerMet ? "default" : "secondary"}>
                {phaseTriggers.ratingTriggerMet ? "Atingido" : "Ainda não"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
