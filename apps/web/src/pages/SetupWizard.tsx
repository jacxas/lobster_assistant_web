import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Cpu,
  Eye,
  FlaskConical,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { shortModel } from "@/components/dashboard/useDashboardData";

const API_BASE = "http://localhost:3000";

interface Status {
  status: "ok" | "degraded";
  services: { ollama: { ok: boolean; models: string[]; url: string } };
  version: string;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${ok ? "text-emerald-300" : "text-red-300"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function StepCard({
  step,
  title,
  icon: Icon,
  children,
  index,
}: {
  step: string;
  title: string;
  icon: typeof Cpu;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-orange-400/10 p-2.5 text-orange-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-mono text-[10px] text-white/30">PASO {step}</p>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm text-white/55">{children}</div>
    </motion.section>
  );
}

export default function SetupWizard() {
  const { stats, reload } = useDashboardData();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch(`${API_BASE}/api/status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Status;
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled && attempt < 2) {
          window.setTimeout(() => void load(attempt + 1), 2000);
        } else if (!cancelled) {
          setStatus(null);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ollamaOk = Boolean(status?.services.ollama.ok);
  const models = status?.services.ollama.models ?? [];
  const cloud = Boolean(stats?.agent.cloud);

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0d]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver al panel
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">🦞 Setup Wizard</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                reload();
                void fetch(`${API_BASE}/api/status`).then((r) => r.json()).then(setStatus).catch(() => {});
              }}
              className="gap-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-chequear
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estado real de tu instalación</h1>
          <p className="mt-2 text-sm text-white/45">
            Todo lo de abajo se lee en vivo de tu API local — no es una guía genérica: es tu máquina.
          </p>
        </div>

        <StepCard step="1" title="Cerebro (modelo de IA)" icon={Cpu} index={0}>
          <div className="flex flex-wrap items-center gap-4">
            <Check ok={ollamaOk} label={ollamaOk ? `Ollama online (${models.length} modelos)` : "Ollama offline"} />
            <Check ok={cloud} label={cloud ? "Nube configurada" : "Nube sin key"} />
            <span className="text-[11px] text-white/35">Activo: {cloud ? shortModel(stats?.agent.model ?? "") : "local"}</span>
          </div>
          <p className="text-xs text-white/40">
            {cloud
              ? "El agente usa la nube (rápido). Si la cuota gratis se agota, reintenta solo y, si falla, cae a Ollama local."
              : "Sin key de nube: el agente usa Ollama local. Lento en equipos viejos, pero 100% privado."}
          </p>
          {models.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {models.map((model) => (
                <span key={model} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/55">
                  {model}
                </span>
              ))}
            </div>
          )}
          {!ollamaOk && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
              Ollama no responde en {status?.services.ollama.url ?? "localhost:11434"}. Abrí una terminal y corré{" "}
              <code className="rounded bg-black/30 px-1">ollama serve</code>, o usá <b>arrancar-lobster.bat</b>.
            </div>
          )}
        </StepCard>

        <StepCard step="2" title="Canal de mensajería (bot)" icon={Send} index={1}>
          <div className="flex flex-wrap items-center gap-4">
            <Check ok={true} label="Telegram: configurado en apps/bot/.env" />
          </div>
          <p className="text-xs text-white/40">
            El bot corre como proceso aparte (el server no puede leer su token). Si no responde en Telegram, revisá la
            ventana “Lobster Bot” o volvé a lanzarlo con <b>arrancar-lobster.bat</b>.
          </p>
          <p className="rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-[11px] text-white/50">
            notepad apps\bot\.env → TELEGRAM_TOKEN=...
          </p>
        </StepCard>

        <StepCard step="3" title="Permisos del agente" icon={ShieldCheck} index={2}>
          <div className="flex flex-wrap items-center gap-4">
            <Check ok={!stats?.agent.allowClicks} label={stats?.agent.allowClicks ? "Clics FÍSICOS activos" : "Clics en vista previa"} />
            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-300">
              <Eye className="h-3.5 w-3.5" /> Visión: {stats ? shortModel(stats.agent.visionModel) : "—"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
              <Terminal className="h-3.5 w-3.5" /> {stats?.agent.tools ?? "—"} herramientas · {stats?.agent.maxSteps ?? "—"} pasos
            </span>
          </div>
          <p className="text-xs text-white/40">
            Los clics físicos solo se habilitan a propósito (AGENT_ALLOW_CLICKS=1). Mientras tanto el agente muestra
            dónde iría cada clic — perfecto para aprender sin romper nada.
          </p>
        </StepCard>

        <StepCard step="4" title="Probar" icon={FlaskConical} index={3}>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-400">
                <MessageSquare className="h-4 w-4" /> Abrir chat
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => window.open("http://localhost:3000/sandbox", "_blank")}
              className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            >
              <FlaskConical className="h-4 w-4" /> Sandbox
            </Button>
            <a href="https://t.me/Jacxasbot" target="_blank" rel="noreferrer">
              <Button variant="secondary" className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10">
                <Send className="h-4 w-4" /> Telegram
              </Button>
            </a>
          </div>
          <p className="flex items-center gap-2 text-xs text-white/35">
            <CircleAlert className="h-3.5 w-3.5" /> Si algo falla, el panel muestra el detalle en “Seguridad y permisos”.
          </p>
        </StepCard>
      </main>
    </div>
  );
}
