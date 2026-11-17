import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Cloud, Cpu, Download, HardDrive, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/config";

interface CatalogModel {
  id: string;
  name: string;
  role: "eco" | "estandar" | "ligero";
  sizeBytes: number;
  ramGb: number;
  contextLength: number;
  uncensored: boolean;
  notes: string;
  installed: boolean;
  downloading: boolean;
  downloadedBytes?: number;
}

interface BrainState {
  mode: "cloud" | "local";
  model: string;
  baseUrl: string;
  cloudAvailable: boolean;
  engine: { running: boolean; url: string | null; modelPath: string | null; port: number };
  downloaded: string[];
}

const mb = (bytes: number): string => `${Math.round(bytes / 1_048_576)} MB`;
const gb = (bytes: number): string => `${(bytes / 1_073_741_824).toFixed(1)} GB`;

export default function ModelsPanel() {
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [brain, setBrain] = useState<BrainState | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [modelsRes, brainRes] = await Promise.all([
        fetch(`${API_BASE}/api/models`),
        fetch(`${API_BASE}/api/brain`),
      ]);
      setModels(((await modelsRes.json()).models ?? []) as CatalogModel[]);
      setBrain((await brainRes.json()) as BrainState);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "sin conexión con el API");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const download = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/models/${id}/download`, { method: "POST" });
      if (!res.ok || !res.body) throw new Error(`descarga: HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const block of parts) {
          const event = /event:\s*(\w+)/.exec(block)?.[1];
          const data = /data:\s*(.*)/.exec(block)?.[1];
          if (!event || !data) continue;
          const payload = JSON.parse(data) as { pct?: number | null; message?: string };
          if (event === "progress" && payload.pct != null) {
            setProgress((prev) => ({ ...prev, [id]: payload.pct as number }));
          }
          if (event === "error") throw new Error(payload.message ?? "error de descarga");
        }
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "falló la descarga");
    } finally {
      setBusy(null);
      setProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      await fetch(`${API_BASE}/api/models/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const useCloud = async () => {
    setBusy("brain");
    try {
      await fetch(`${API_BASE}/api/brain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "cloud" }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const useLocal = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/brain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "local", modelId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "no se pudo iniciar el motor");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "no se pudo iniciar el motor");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Cerebro activo</h2>
            <p className="mt-1 text-xs text-white/40">
              {brain
                ? `${brain.mode === "local" ? "Motor local propio (sin internet)" : "Nube (Gemini/Groq/OpenRouter)"} · modelo: ${brain.model}`
                : "leyendo estado…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                brain?.engine.running
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  : "border-white/15 bg-white/5 text-white/45"
              }`}
            >
              <Cpu className="h-3 w-3" /> motor {brain?.engine.running ? "corriendo" : "detenido"}
            </span>
            <Button
              size="sm"
              onClick={() => void useCloud()}
              disabled={busy !== null}
              className="gap-2 rounded-lg bg-orange-500 text-white hover:bg-orange-400"
            >
              <Cloud className="h-3.5 w-3.5" /> Usar nube
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs text-red-300">{error}</p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.045]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Modelos locales (descarga bajo demanda)</h2>
          <p className="mt-1 text-[11px] text-white/35">
            Sin Ollama: el motor es llama.cpp y viaja con la app. Los modelos se bajan una vez y quedan en tu disco.
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {models.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  {model.name}{" "}
                  <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/45">
                    {model.role}
                  </span>
                  {model.uncensored && (
                    <span className="ml-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300">
                      sin filtro
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-white/35">
                  {model.sizeBytes > 1_000_000_000 ? gb(model.sizeBytes) : mb(model.sizeBytes)} · RAM {model.ramGb} GB ·
                  contexto {(model.contextLength / 1024).toFixed(0)}K
                </p>
                <p className="mt-1 text-[11px] leading-4 text-white/45">{model.notes}</p>
                {progress[model.id] !== undefined && (
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${progress[model.id]}%` }} />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {model.installed ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> instalado
                    </span>
                    <Button
                      size="sm"
                      onClick={() => void useLocal(model.id)}
                      disabled={busy !== null}
                      className="gap-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                    >
                      <HardDrive className="h-3.5 w-3.5" /> Usar local
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void remove(model.id)}
                      disabled={busy !== null}
                      title="Borrar del disco"
                      className="rounded-lg border border-white/10 bg-white/5 text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => void download(model.id)}
                    disabled={busy !== null}
                    className="gap-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {busy === model.id ? "descargando…" : "Descargar"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          {models.length === 0 && !error && <p className="px-5 py-6 text-xs text-white/35">Cargando catálogo…</p>}
        </div>
      </section>

      <p className="flex items-start gap-2 text-[11px] leading-5 text-white/30">
        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        En esta PC (3.5 GB de RAM, CPU de 2011) un 1B rinde ~0,2-0,5 tok/s: el modo local es para offline o para PCs
        mejores. Para uso diario, dejá el cerebro en la nube (gratis con tu key).
      </p>
    </div>
  );
}
