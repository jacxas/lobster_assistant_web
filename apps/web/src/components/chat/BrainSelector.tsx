import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Cloud, Cpu, Loader2 } from "lucide-react";

import { API_BASE } from "@/config";
import { cn } from "@/lib/utils";

export interface CatalogModel {
  id: string;
  name: string;
  ramGb: number;
  installed: boolean;
}

export interface BrainState {
  mode: "cloud" | "local";
  model: string;
  baseUrl: string;
  cloudAvailable: boolean;
  engine: { running: boolean; url: string | null; port: number };
  downloaded: string[];
}

/** Abre una app del escritorio (Models, System…) desde cualquier componente. */
export const navegarA = (id: string) => {
  window.dispatchEvent(new CustomEvent("lobster:navigate", { detail: id }));
};

const corto = (model: string) => model.replace(/^.*\//, "").replace(/:free$/, "");

export default function BrainSelector({ onChanged }: { onChanged?: (brain: BrainState) => void }) {
  const [brain, setBrain] = useState<BrainState | null>(null);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [open, setOpen] = useState(false);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [rb, rm] = await Promise.all([fetch(`${API_BASE}/api/brain`), fetch(`${API_BASE}/api/models`)]);
      const b = (await rb.json()) as BrainState;
      setBrain(b);
      onChanged?.(b);
      if (rm.ok) {
        const data = (await rm.json()) as { models?: CatalogModel[] } | CatalogModel[];
        setModels(Array.isArray(data) ? data : data.models ?? []);
      }
    } catch {
      /* el panel sigue mostrando el último estado conocido */
    }
  }, [onChanged]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cambiar = async (payload: { mode: "cloud" } | { mode: "local"; modelId: string }, clave: string) => {
    if (cambiando) return;
    setCambiando(clave);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/brain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || `El servidor respondió ${res.status}`);
      await cargar();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "No se pudo cambiar el cerebro");
    } finally {
      setCambiando(null);
    }
  };

  const descargados = models.filter((m) => brain?.downloaded.includes(m.id));
  const nombreLocal = (id: string) => models.find((m) => m.id === id)?.name ?? corto(id);
  const activo = brain ? (brain.mode === "cloud" ? corto(brain.model) : nombreLocal(brain.model)) : "cargando…";

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Cambiar el cerebro del asistente"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/55 transition hover:bg-white/10 hover:text-white",
          open && "border-orange-400/40 bg-orange-400/10 text-orange-200"
        )}
      >
        {brain?.mode === "local" ? <Cpu className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
        <span className="max-w-[150px] truncate">{activo}</span>
        <ChevronDown className={cn("h-3 w-3 opacity-60 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0f0d0c]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          <p className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-wider text-white/30">Cerebro del asistente</p>

          <button
            type="button"
            role="menuitem"
            disabled={!brain?.cloudAvailable || Boolean(cambiando)}
            onClick={() => void cambiar({ mode: "cloud" }, "cloud")}
            className={cn(
              "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40",
              brain?.mode === "cloud" && "bg-white/[0.04]"
            )}
          >
            <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-white/85">Nube gratuita</span>
              <span className="block truncate text-[10px] text-white/35">
                {cambiando === "cloud" ? "conectando…" : brain?.cloudAvailable ? corto(brain.model) : "sin clave configurada"}
              </span>
            </span>
            {cambiando === "cloud" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-300" />
            ) : (
              brain?.mode === "cloud" && <Check className="h-3.5 w-3.5 text-orange-300" />
            )}
          </button>

          <div className="my-1 border-t border-white/10" />
          <p className="px-2 pb-1 text-[10px] uppercase tracking-wider text-white/30">En esta PC (sin internet)</p>

          {descargados.length === 0 ? (
            <div className="px-2 py-2">
              <p className="text-[11px] leading-4 text-white/35">Todavía no hay modelos descargados.</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navegarA("models");
                }}
                className="mt-1 text-[11px] text-orange-300 hover:text-orange-200"
              >
                Ir a Models →
              </button>
            </div>
          ) : (
            descargados.map((m) => {
              const esActivo = brain?.mode === "local" && brain.model === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="menuitem"
                  disabled={Boolean(cambiando)}
                  onClick={() => void cambiar({ mode: "local", modelId: m.id }, m.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40",
                    esActivo && "bg-white/[0.04]"
                  )}
                >
                  <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-white/85">{m.name}</span>
                    <span className="block text-[10px] text-white/35">
                      {cambiando === m.id ? "iniciando motor… (puede tardar ~1 min)" : `RAM ${m.ramGb} GB · lento`}
                    </span>
                  </span>
                  {cambiando === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-300" />
                  ) : (
                    esActivo && <Check className="h-3.5 w-3.5 text-orange-300" />
                  )}
                </button>
              );
            })
          )}

          {error && <p className="mt-1 rounded-lg bg-red-400/10 px-2 py-1.5 text-[10px] leading-4 text-red-300">{error}</p>}

          <p className="mt-1 border-t border-white/10 px-2 pb-0.5 pt-1.5 text-[10px] leading-4 text-white/25">
            En local el modelo corre en tu CPU y nada sale de la máquina. En nube, el texto viaja al proveedor
            gratuito configurado.
          </p>
        </div>
      )}
    </div>
  );
}
