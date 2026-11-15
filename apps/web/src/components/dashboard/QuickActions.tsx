import { motion } from "framer-motion";
import { MessageSquare, Brain, Eye, FlaskConical, Send, Layers } from "lucide-react";
import { TELEGRAM_BOT, TELEGRAM_URL } from "@/config";

interface Action {
  label: string;
  desc: string;
  icon: typeof MessageSquare;
  run: () => void;
  accent: string;
}

export function QuickActions({ onNavigate }: { onNavigate: (id: string) => void }) {
  const actions: Action[] = [
    {
      label: "Chat",
      desc: "Conversación normal",
      icon: MessageSquare,
      run: () => onNavigate("assistant"),
      accent: "text-orange-300",
    },
    {
      label: "Agente",
      desc: "Tareas con herramientas",
      icon: Brain,
      run: () => onNavigate("assistant"),
      accent: "text-emerald-300",
    },
    {
      label: "Visión",
      desc: "Mirar la pantalla",
      icon: Eye,
      run: () => onNavigate("assistant"),
      accent: "text-sky-300",
    },
    {
      label: "Sandbox",
      desc: "Zona de pruebas segura",
      icon: FlaskConical,
      run: () => window.open("http://localhost:3000/sandbox", "_blank"),
      accent: "text-amber-300",
    },
    {
      label: "Bot Telegram",
      desc: `@${TELEGRAM_BOT}`,
      icon: Send,
      run: () => window.open(TELEGRAM_URL, "_blank"),
      accent: "text-blue-300",
    },
    {
      label: "Modelos",
      desc: "Ollama y proveedores",
      icon: Layers,
      run: () => onNavigate("models"),
      accent: "text-violet-300",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-wide text-white">Accesos rápidos</h2>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map(({ label, desc, icon: Icon, run, accent }) => (
          <button
            key={label}
            onClick={run}
            className="group flex items-center gap-3 rounded-xl border border-white/8 bg-black/10 p-3.5 text-left transition hover:border-orange-400/30 hover:bg-orange-400/5"
          >
            <div className={`rounded-lg bg-white/5 p-2 text-white/60 group-hover:text-white ${accent}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{label}</p>
              <p className="truncate text-[11px] text-white/35">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.section>
  );
}
