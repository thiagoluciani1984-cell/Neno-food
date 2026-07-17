import { Phone, MessageCircle, Bike } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OrderDriverInfo } from "@/features/delivery/queries";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

const VEHICLE_LABEL: Record<string, string> = {
  motorcycle: "Moto",
  bike: "Bicicleta",
  car: "Carro",
};

export function DriverInfoCard({ driver }: { driver: OrderDriverInfo }) {
  const initials = driver.full_name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const phoneDigits = driver.phone ? onlyDigits(driver.phone) : null;
  const whatsappHref = phoneDigits ? `https://wa.me/55${phoneDigits}` : null;
  const telHref = phoneDigits ? `tel:+55${phoneDigits}` : null;
  const vehicleLabel = VEHICLE_LABEL[driver.vehicle_type] ?? driver.vehicle_type;

  return (
    <Card className="mb-6 border-orange-100">
      <CardContent className="flex items-center gap-4 py-4">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          <AvatarImage src={driver.avatar_url ?? undefined} alt={driver.full_name} />
          <AvatarFallback className="bg-orange-100 text-primary">
            {initials || "🛵"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{driver.full_name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Bike className="h-3.5 w-3.5" />
            {vehicleLabel}
            {driver.vehicle_plate ? ` · ${driver.vehicle_plate}` : ""}
          </p>
        </div>

        {(telHref || whatsappHref) && (
          <div className="flex shrink-0 gap-2">
            {telHref && (
              <Button asChild size="icon" variant="outline">
                <Link href={telHref} aria-label="Ligar para o entregador">
                  <Phone className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {whatsappHref && (
              <Button asChild size="icon" className="bg-green-600 hover:bg-green-700">
                <Link href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp do entregador">
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
