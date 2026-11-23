// Persistencia del cerebro elegido: sin esto, cada reinicio del server volvía
// a la nube y el usuario tenía que volver a elegir el modelo local.
import path from "node:path";
import { existsSync } from "node:fs";
import { getSetting, setSetting } from "../db/settings.js";
import { clearBrain, getBrain, setBrain } from "./llm.js";
import { ENGINE_DIR, localEngine } from "./engine.js";
import { findModel } from "./modelCatalog.js";
import { warmupLocal } from "./ollama.js";

const BROWS_KEY = "brain";
const MODELS_DIR = process.env.LOBSTER_MODELS_DIR || path.resolve(ENGINE_DIR, "../.data/models");

export type BrainPreference = { mode: "cloud" } | { mode: "local"; modelId: string };

/** Valida el JSON guardado. Función pura: fácil de testear. */
export function parseBrainPref(raw: string | null): BrainPreference | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { mode?: unknown; modelId?: unknown };
    if (data.mode === "cloud") return { mode: "cloud" };
    if (data.mode === "local" && typeof data.modelId === "string" && findModel(data.modelId)) {
      return { mode: "local", modelId: data.modelId };
    }
  } catch {
    /* JSON corrupto: se ignora y queda la nube */
  }
  return null;
}

export const modelFile = (id: string): string => path.join(MODELS_DIR, `${id}.gguf`);

/** Guarda la elección para el próximo arranque. */
export function saveBrainPreference(pref: BrainPreference): void {
  if (pref.mode === "cloud") {
    setSetting(BROWS_KEY, JSON.stringify({ mode: "cloud" }));
    return;
  }
  setSetting(BROWS_KEY, JSON.stringify({ mode: "local", modelId: pref.modelId }));
}

export function savedBrainPreference(): BrainPreference | null {
  return parseBrainPref(getSetting(BROWS_KEY));
}

/**
 * Restaura la elección guardada al arrancar. Si era local y el modelo sigue en
 * disco, levanta el motor y precalienta; si algo falla, cae a la nube.
 */
export async function restoreSavedBrain(): Promise<void> {
  const pref = savedBrainPreference();
  if (!pref || pref.mode === "cloud") {
    clearBrain();
    return;
  }

  const file = modelFile(pref.modelId);
  if (!existsSync(file)) {
    console.warn(`[brain] el modelo guardado ${pref.modelId} ya no está en disco; uso la nube`);
    clearBrain();
    return;
  }

  try {
    const url = await localEngine.start(file);
    setBrain({ mode: "local", baseUrl: url, apiKey: "local", model: pref.modelId, visionModel: "" });
    console.log(`[brain] restaurado modo local con ${pref.modelId}`);
    void warmupLocal(url);
  } catch (error) {
    console.warn("[brain] no se pudo restaurar el motor local:", error instanceof Error ? error.message : error);
    clearBrain();
  }
}

/** Texto para logs/estado. */
export const brainSummary = (): string => `${getBrain().mode}${getBrain().mode === "local" ? `:${getBrain().model}` : ""}`;
