"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/infra/supabase/client";
import { cardItem, mascotFloat } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import {
  formatAddressForMaps,
  mapsCoordsUrl,
  mapsDirectionsUrl,
  mapsSearchUrl,
} from "@/features/delivery/maps";
import type { LatLng } from "@/features/delivery/components/live-delivery-map";
import type { DeliveryAddressSnapshot } from "@/types/database.types";

const LiveDeliveryMap = dynamic(
  () => import("@/features/delivery/components/live-delivery-map").then((m) => m.LiveDeliveryMap),
  { ssr: false, loading: () => <div className="h-64 w-full animate-pulse bg-orange-50" /> }
);

interface TrackingPoint {
  latitude: number;
  longitude: number;
  created_at: string;
}

export function DeliveryTrackingCard({
  orderId,
  deliveryAddress,
  initialPoint,
  destination,
}: {
  orderId: string;
  deliveryAddress: DeliveryAddressSnapshot | null;
  initialPoint: TrackingPoint | null;
  destination?: LatLng | null;
}) {
  const [point, setPoint] = useState<TrackingPoint | null>(initialPoint);
  const addressQuery = formatAddressForMaps(deliveryAddress);
  const cardVariants = useNenosVariants(cardItem);

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
    <motion.div variants={cardVariants} initial="initial" animate="animate">
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
              <div className="relative h-64 w-full overflow-hidden rounded-lg border">
                <LiveDeliveryMap
                  driverPosition={{ lat: Number(point.latitude), lng: Number(point.longitude) }}
                  destination={destination ?? null}
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
            <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-4 text-sm text-muted-foreground">
              <motion.div animate={mascotFloat} className="text-2xl">
                🛵
              </motion.div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Aguardando localização do entregador...
              </div>
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
    </motion.div>
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
