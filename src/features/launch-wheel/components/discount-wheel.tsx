"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { spinWheelAction } from "@/features/launch-wheel/actions";
import { WHEEL_SEGMENTS } from "@/features/launch-wheel/constants";

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const SPIN_MS = 3800;
const COLORS = ["#e2592a", "#2f1a12"]; // laranja da marca / marrom escuro, alternados

function segmentBackground(): string {
  const stops = WHEEL_SEGMENTS.map((_, i) => {
    const color = COLORS[i % 2];
    const start = i * SEGMENT_ANGLE;
    const end = start + SEGMENT_ANGLE;
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function DiscountWheel() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const background = useMemo(() => segmentBackground(), []);

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);

    spinWheelAction().then((res) => {
      if (!res.ok) {
        setSpinning(false);
        toast.error(res.error);
        return;
      }

      const index = WHEEL_SEGMENTS.indexOf(
        res.spin.discount_percent as (typeof WHEEL_SEGMENTS)[number]
      );
      const segmentCenter = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const fullSpins = 5;
      const target = fullSpins * 360 - segmentCenter;
      setRotation(target);

      window.setTimeout(() => {
        setSpinning(false);
        toast.success(`Você ganhou ${res.spin.discount_percent}% de desconto neste pedido!`);
        router.refresh();
      }, SPIN_MS);
    });
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Roleta de lançamento
        </CardTitle>
        <CardDescription>
          Gire e ganhe um desconto de 10% a 50% neste pedido — vale nos seus 5 primeiros pedidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 pb-6">
        <div className="relative h-56 w-56">
          {/* ponteiro */}
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
            <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-foreground drop-shadow" />
          </div>

          <div
            className="relative h-full w-full rounded-full border-4 border-white shadow-lg"
            style={{
              background,
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${SPIN_MS}ms cubic-bezier(0.17, 0.67, 0.24, 0.99)`
                : "none",
            }}
          >
            {WHEEL_SEGMENTS.map((value, i) => {
              const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              // Vira o texto na metade de baixo pra nunca ficar de cabeça pra baixo.
              const flip = angle > 90 && angle < 270;
              return (
                <span
                  key={value}
                  className="absolute left-1/2 top-1/2 origin-top text-sm font-black text-white"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-88px) translateX(-50%) rotate(${flip ? 180 : 0}deg)`,
                  }}
                >
                  {value}%
                </span>
              );
            })}
          </div>

          {/* hub central */}
          <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-primary shadow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>

        <Button onClick={handleSpin} disabled={spinning} size="lg" className="w-full max-w-xs">
          {spinning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Girando...
            </>
          ) : (
            "Girar a roleta"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
