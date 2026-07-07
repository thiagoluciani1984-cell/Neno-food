"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/infra/supabase/client";
import {
  cardItem,
  mascotFloat,
  nenosClass,
} from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
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

function RouteOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      viewBox="0 0 320 192"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M24 160 C 80 40, 120 140, 160 96 S 260 24, 296 48"
        fill="none"
        stroke="#F97316"
        strokeWidth="3"
        strokeLinecap="round"
        className={nenosClass.routeDash}
      />
    </svg>
  );
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
              <div className="relative overflow-hidden rounded-lg border">
                <iframe
                  title="Mapa da entrega"
                  src={openStreetMapEmbedUrl(
                    Number(point.latitude),
                    Number(point.longitude)
                  )}
                  className="relative z-0 h-48 w-full border-0"
                  loading="lazy"
                />
                <RouteOverlay />
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
