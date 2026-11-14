import { motion } from "framer-motion";
import { Bot, User as UserIcon, Activity } from "lucide-react";
import type { DashboardStats } from "./useDashboardData";

const relativeTime = (epochSeconds: number): string => {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - epochSeconds);
  if (diff < 60) return "hace instantes";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
};

const PLATFORM_LABEL: Record<string, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  discord: "Discord",
  slack: "Slack",
  web: "Web",
};

export function RecentActivity({ stats }: { stats: DashboardStats | null }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-wide text-white">Actividad reciente</h2>
        <Activity className="h-4 w-4 text-white/30" />
      </div>
      <div className="p-3">
        {!stats ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
            ))}
          </div>
        ) : stats.recent.length === 0 ? (
          <p className="p-3 text-xs text-white/35">Sin mensajes todavía — abrí el chat y hablá con el langosta.</p>
        ) : (
          <ul className="space-y-1">
            {stats.recent.map((item, i) => (
              <li key={`${item.created_at}-${i}`} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]">
                <span
                  className={`mt-0.5 rounded-md p-1.5 ${
                    item.role === "assistant" ? "bg-orange-400/10 text-orange-300" : "bg-white/5 text-white/50"
                  }`}
                >
                  {item.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white/65">{item.content || "(vacío)"}</p>
                  <p className="mt-0.5 text-[10px] text-white/25">
                    {PLATFORM_LABEL[item.platform] ?? item.platform} · {relativeTime(item.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  );
}
