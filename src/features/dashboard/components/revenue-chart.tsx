"use client";

import { formatBRL } from "@/lib/money";

export type DailyRevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
};

export function RevenueChart({ data }: { data: DailyRevenuePoint[] }) {
  const points = data.slice(-14);

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados de faturamento no período.</p>;
  }

  const maxRevenue = Math.max(...points.map((d) => d.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-extrabold">Faturamento por dia</h3>
        <p className="text-xs text-muted-foreground">Últimos {points.length} dias</p>
      </div>
      <div className="space-y-2">
        {points.map((day) => (
          <div key={day.date} className="flex items-center gap-3 text-sm">
            <span className="w-14 shrink-0 text-xs text-muted-foreground">
              {new Date(`${day.date}T12:00:00`).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-orange-50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                style={{
                  width: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%`,
                }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-xs font-semibold">
              {formatBRL(day.revenue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
