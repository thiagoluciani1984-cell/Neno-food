"use client";

import { motion } from "framer-motion";
import { dashboardChartMotion, hoverLift } from "@/lib/motion/nenos-motion";
import { useNenosVariants } from "@/lib/motion/use-nenos-motion";
import { RevenueChart, type DailyRevenuePoint } from "./revenue-chart";

export function RevenueChartCard({ data }: { data: DailyRevenuePoint[] }) {
  const variants = useNenosVariants(dashboardChartMotion);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      whileHover={hoverLift}
      className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
    >
      <RevenueChart data={data} />
    </motion.div>
  );
}
