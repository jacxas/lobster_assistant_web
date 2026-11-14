import { motion } from "framer-motion";
import { MousePointerClick, Eye, ShieldCheck, Server, Terminal } from "lucide-react";
import type { DashboardStats } from "./useDashboardData";
import { shortModel } from "./useDashboardData";

interface Row {
  label: string;
  value: string;
  detail: string;
  state: "ok" | "warn" | "off";
  icon: typeof ShieldCheck;
}

export function SecurityOverview({ stats }: { stats: DashboardStats | null }) {
  const rows: Row[] = stats
    ? [
        {
          label: "Clics físicos",
          value: stats.agent.allowClicks ? "Activos" : "Vista previa",
          detail: stats.agent.allowClicks
            ? "Puede clicar de verdad — usalo solo en el sandbox"
            : "Los clics solo muestran dónde irían (AGENT_ALLOW_CLICKS=0)",
          state: stats.agent.allowClicks ? "warn" : "ok",
          icon: MousePointerClick,
        },
        {
          label: "Visión",
          value: "Activa",
          detail: `Captura + ${shortModel(stats.agent.visionModel)} — la imagen se envía al proveedor`,
          state: "warn",
          icon: Eye,
        },
        {
          label: "Allowlist de comandos",
          value: "12 comandos",
          detail: "dir, type, where, tasklist, systeminfo… sin metacaracteres de shell",
          state: "ok",
          icon: Terminal,
        },
        {
          label: "Cerebro",
          value: stats.agent.cloud ? "Nube" : "Local",
          detail: stats.agent.cloud ? shortModel(stats.agent.model) : "Ollama en tu PC",
          state: "ok",
          icon: Server,
        },
      ]
    : [];

  const pill = (state: Row["state"]) =>
    state === "ok"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : state === "warn"
        ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
        : "border-white/15 bg-white/5 text-white/45";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className="rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-wide text-white">Seguridad y permisos</h2>
        <ShieldCheck className="h-4 w-4 text-emerald-400/70" />
      </div>
      <div className="divide-y divide-white/5">
        {!stats ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
            ))}
          </div>
        ) : (
          rows.map(({ label, value, detail, state, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3 px-5 py-3.5">
              <span className="mt-0.5 rounded-md bg-white/5 p-1.5 text-white/50">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/80">{label}</p>
                <p className="mt-0.5 text-[11px] leading-5 text-white/35">{detail}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pill(state)}`}>
                {value}
              </span>
            </div>
          ))
        )}
      </div>
    </motion.section>
  );
}
