import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DeliveryPinCard({
  code,
  confirmed,
}: {
  code: string;
  confirmed: boolean;
}) {
  if (confirmed) return null;

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" />
          Código de entrega
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Mostre este código ao entregador para confirmar o recebimento:
        </p>
        <p className="text-center font-mono text-4xl font-bold tracking-[0.3em] text-primary">
          {code}
        </p>
      </CardContent>
    </Card>
  );
}
