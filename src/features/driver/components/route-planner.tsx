"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Route, ExternalLink, Loader2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOptimizedRouteAction, type OptimizedRoute } from "../actions";

export function RoutePlanner({ orderIds }: { orderIds: string[] }) {
  const [pending, startTransition] = useTransition();
  const [route, setRoute] = useState<OptimizedRoute | null>(null);

  function handleCalculate() {
    if (!("geolocation" in navigator)) {
      toast.error("Seu navegador não suporta localização.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const result = await getOptimizedRouteAction(
            orderIds,
            position.coords.latitude,
            position.coords.longitude
          );
          if ("error" in result || !result.data) {
            toast.error("error" in result ? result.error : "Não foi possível calcular a rota.");
            return;
          }
          setRoute(result.data);
          if (result.data.skipped.length > 0) {
            toast.warning(
              `${result.data.skipped.length} endereço(s) não foram localizados e ficaram de fora da rota.`
            );
          }
        });
      },
      () => toast.error("Não foi possível acessar sua localização. Ative o GPS e tente de novo.")
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="h-4 w-4 text-primary" />
          Melhor rota pras suas {orderIds.length} entregas
        </CardTitle>
        <CardDescription>
          Calcula a ordem de visita mais curta a partir da sua localização atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!route ? (
          <Button className="w-full gap-2" onClick={handleCalculate} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
            Calcular melhor rota
          </Button>
        ) : (
          <>
            <ol className="space-y-2">
              {route.stops.map((stop, index) => (
                <li
                  key={stop.orderId}
                  className="flex items-start gap-3 rounded-lg border bg-white px-3 py-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      #{stop.orderNumber} · {stop.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">{stop.address}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Button asChild className="w-full gap-2">
              <a href={route.mapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Abrir rota no Google Maps
              </a>
            </Button>

            <Button variant="ghost" size="sm" className="w-full" onClick={handleCalculate} disabled={pending}>
              {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Recalcular
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
