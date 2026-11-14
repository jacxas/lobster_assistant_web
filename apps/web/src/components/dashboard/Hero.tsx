import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Lock, ShieldCheck, Sparkles, ServerOff, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

const BADGES = [
  { label: "Local-first", icon: Lock },
  { label: "Privacidad primero", icon: ShieldCheck },
  { label: "Cerebro cloud opcional", icon: ServerOff },
];

export function Hero({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/12 via-white/[0.04] to-transparent p-6 md:p-9"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative z-10 max-w-2xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1 text-[11px] font-medium text-orange-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
          Lobster OS · runtime listo
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Tu asistente local, con manos y ojos. 🦞
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/50">
          Chatea, ejecuta herramientas en tu PC, mira la pantalla y verifica resultados — desde una sola consola.
          Nada de lo que haces se sube a ningún lado, salvo el texto o la captura que vos decidas enviar al cerebro.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button onClick={onOpenChat} className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-400">
            Abrir Assistant
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open("http://localhost:3000/sandbox", "_blank")}
            className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <FlaskConical className="h-4 w-4" aria-hidden />
            Sandbox de pruebas
          </Button>
          <Link href="/landing">
            <Button
              variant="secondary"
              className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Ver landing
            </Button>
          </Link>
        </div>

        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
          {BADGES.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-white/45">
              <Icon size={13} aria-hidden className="text-emerald-400" />
              {label}
            </li>
          ))}
          <li className="flex items-center gap-1.5 text-[11px] font-medium text-white/45">
            <Sparkles size={13} aria-hidden className="text-orange-300" />
            Agente con 10 herramientas
          </li>
        </ul>
      </div>
    </motion.section>
  );
}
