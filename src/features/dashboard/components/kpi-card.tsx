"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  Flame,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { hoverLift } from "@/lib/motion/nenos-motion";
import { Card, CardContent } from "@/components/ui/card";

export type KpiIcon = "orders" | "revenue" | "ticket" | "in-progress" | "customers";

export type KpiData = {
  id: string;
  label: string;
  value: string;
  tint: string;
  icon: KpiIcon;
};

const KPI_ICONS: Record<KpiIcon, LucideIcon> = {
  orders: ShoppingBag,
  revenue: DollarSign,
  ticket: TrendingUp,
  "in-progress": Flame,
  customers: Users,
};

export function KpiCard({ data }: { data: KpiData }) {
  const Icon = KPI_ICONS[data.icon];

  return (
    <motion.div whileHover={hoverLift} className="h-full">
      <Card className="h-full overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{data.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{data.value}</p>
            <p className="mt-1 text-xs font-semibold text-green-600">↑ operação ativa</p>
          </div>
          <div className={`rounded-2xl p-3 ${data.tint}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
      </Card>
    </motion.div>
  );
}
