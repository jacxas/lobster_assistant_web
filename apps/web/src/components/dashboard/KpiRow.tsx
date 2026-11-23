import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { Cpu, Bot, MessageSquare, Cloud, HardDrive } from "lucide-react";
import type { DashboardStats } from "./useDashboardData";
import { shortModel } from "./useDashboardData";

interface KpiProps {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  loading: boolean;
  index: number;
}

function Kpi({ label, value, hint, icon: Icon, accent, loading, index }: KpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">{label}</p>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className={`mt-2 truncate text-xl font-semibold ${loading ? "animate-pulse text-white/25" : "text-white"}`}>
        {loading ? "···" : value}
      </p>
      <p className="mt-1 truncate text-[11px] text-white/35">{hint}</p>
    </motion.div>
  );
}

export function KpiRow({ stats }: { stats: DashboardStats | null }) {
  const loading = !stats;
  const kpis: Omit<KpiProps, "loading" | "index">[] = [
    {
      label: "Modelo activo",
      value: stats ? shortModel(stats.agent.model) : "",
      hint: stats?.agent.cloud ? "Cerebro en la nube" : "Motor propio (llama.cpp)",
      icon: Cpu,
      accent: "text-orange-300",
    },
    {
      label: "Mensajes hoy",
      value: stats ? stats.messages.today.toLocaleString("es") : "",
      hint: stats ? `${stats.messages.total.toLocaleString("es")} en total · SQLite` : "",
      icon: MessageSquare,
      accent: "text-sky-300",
    },
    {
      label: "Sesiones",
      value: stats ? stats.sessions.total.toString() : "",
      hint: "Web + canales de mensajería",
      icon: Bot,
      accent: "text-violet-300",
    },
    {
      label: "Cerebro",
      value: stats ? (stats.agent.cloud ? "Nube" : "Local") : "",
      hint: stats ? (stats.agent.cloud ? "API externa · tier gratis" : "llama.cpp · privado") : "",
      icon: stats?.agent.cloud ? Cloud : HardDrive,
      accent: "text-emerald-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" role="list" aria-label="Métricas clave">
      {kpis.map((kpi, i) => (
        <Kpi key={kpi.label} {...kpi} loading={loading} index={i} />
      ))}
    </div>
  );
}
