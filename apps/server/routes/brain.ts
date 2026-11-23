import path from "node:path";
import { Router } from "express";
import { stat } from "node:fs/promises";
import { clearBrain, cloudEnabled, getBrain, setBrain } from "../services/llm.js";
import { ENGINE_DIR, localEngine } from "../services/engine.js";
import { MODEL_CATALOG, findModel } from "../services/modelCatalog.js";

const MODELS_DIR = process.env.LOBSTER_MODELS_DIR || path.resolve(ENGINE_DIR, "../.data/models");
const modelFile = (id: string) => path.join(MODELS_DIR, `${id}.gguf`);

const downloadedModels = async (): Promise<string[]> => {
  const found: string[] = [];
  for (const entry of MODEL_CATALOG) {
    try {
      await stat(modelFile(entry.id));
      found.push(entry.id);
    } catch {
      /* no descargado */
    }
  }
  return found;
};

export const brainRouter: Router = Router();

/** GET /api/brain — cerebro activo + motor local + modelos disponibles. */
brainRouter.get("/", async (_req, res) => {
  const brain = getBrain();
  res.json({
    mode: brain.mode,
    model: brain.model,
    baseUrl: brain.baseUrl,
    cloudAvailable: cloudEnabled(),
    engine: localEngine.status(),
    downloaded: await downloadedModels(),
  });
});

/** POST /api/brain { mode: "cloud" | "local", modelId? } — cambia el cerebro en caliente. */
brainRouter.post("/", async (req, res) => {
  const mode = req.body?.mode;
  if (mode === "cloud") {
    clearBrain();
    // En una PC de 3,5 GB dejar el motor local vivo tras volver a la nube
    // se come ~1 GB: se apaga para liberar memoria.
    await localEngine.stop();
    res.json({ ok: true, mode: "cloud", model: getBrain().model });
    return;
  }
  if (mode === "local") {
    const modelId = typeof req.body?.modelId === "string" ? req.body.modelId : "";
    const entry = findModel(modelId);
    if (!entry) {
      res.status(400).json({ error: "modelId inválido", available: (await downloadedModels()).length ? await downloadedModels() : MODEL_CATALOG.map((m) => m.id) });
      return;
    }
    try {
      const url = await localEngine.start(modelFile(entry.id));
      setBrain({ mode: "local", baseUrl: url, apiKey: "local", model: entry.id, visionModel: "" });
      res.json({ ok: true, mode: "local", model: entry.id, url });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  res.status(400).json({ error: 'mode debe ser "cloud" o "local"' });
});
