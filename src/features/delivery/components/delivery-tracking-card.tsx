"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/infra/supabase/client";
import {
  formatAddressForMaps,
  mapsCoordsUrl,
  mapsDirectionsUrl,
  mapsSearchUrl,
  openStreetMapEmbedUrl,
} from "@/features/delivery/maps";
import type { DeliveryAddressSnapshot } from "@/types/database.types";

interface TrackingPoint {
  latitude: number;
  longitude: number;
  created_at: string;
}

export function DeliveryTrackingCard({
  orderId,
  deliveryAddress,
  initialPoint,
}: {
  orderId: string;
  deliveryAddress: DeliveryAddressSnapshot | null;
  initialPoint: TrackingPoint | null;
}) {
  const [point, setPoint] = useState<TrackingPoint | null>(initialPoint);
  const addressQuery = formatAddressForMaps(deliveryAddress);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`delivery-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "delivery_tracking",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const row = payload.new as TrackingPoint;
          setPoint(row);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const mapsUrl = point
    ? mapsCoordsUrl(Number(point.latitude), Number(point.longitude))
    : addressQuery
      ? mapsSearchUrl(addressQuery)
      : null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation className="h-4 w-4 text-primary" />
          Rastreamento da entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {point ? (
          <>
            <div className="overflow-hidden rounded-lg border">
              <iframe
                title="Mapa da entrega"
                src={openStreetMapEmbedUrl(
                  Number(point.latitude),
                  Number(point.longitude)
                )}
                className="h-48 w-full border-0"
                loading="lazy"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Última atualização:{" "}
              {new Date(point.created_at).toLocaleString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Aguardando localização do entregador...
          </div>
        )}

        {addressQuery && (
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {addressQuery}
          </p>
        )}

        {mapsUrl && (
          <Button asChild variant="outline" className="w-full">
            <Link href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Abrir no Google Maps
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function DeliveryNavigateButton({
  deliveryAddress,
}: {
  deliveryAddress: DeliveryAddressSnapshot | null;
}) {
  const query = formatAddressForMaps(deliveryAddress);
  if (!query) return null;

  return (
    <Button asChild variant="outline" className="w-full gap-2">
      <Link href={mapsDirectionsUrl(query)} target="_blank" rel="noopener noreferrer">
        <Navigation className="h-4 w-4" />
        Navegar até o endereço
      </Link>
    </Button>
  );
}
