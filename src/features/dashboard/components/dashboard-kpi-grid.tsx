"use client";

import { motion } from "framer-motion";
import { dashboardKpiMotion, staggerContainer } from "@/lib/motion/nenos-motion";
import { KpiCard, type KpiData } from "./kpi-card";

export function DashboardKpiGrid({ kpis }: { kpis: KpiData[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.id} variants={dashboardKpiMotion}>
          <KpiCard data={kpi} />
        </motion.div>
      ))}
    </motion.div>
  );
}
