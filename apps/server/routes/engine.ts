import path from "node:path";
import { Router } from "express";
import { stat } from "node:fs/promises";
import { ENGINE_DIR, localEngine } from "../services/engine.js";
import { findModel, MODEL_CATALOG } from "../services/modelCatalog.js";

export const MODELS_DIR = process.env.LOBSTER_MODELS_DIR || path.resolve(ENGINE_DIR, "../.data/models");

const modelFile = (id: string) => path.join(MODELS_DIR, `${id}.gguf`);

export const engineRouter: Router = Router();

/** GET /api/engine — estado del motor propio + catálogo con disponibilidad local. */
engineRouter.get("/", async (_req, res) => {
  const available = await Promise.all(
    MODEL_CATALOG.map(async (entry) => {
      try {
        await stat(modelFile(entry.id));
        return entry.id;
      } catch {
        return null;
      }
    })
  );
  res.json({
    engine: { ...localEngine.status(), binaryDir: ENGINE_DIR },
    modelsDir: MODELS_DIR,
    downloaded: available.filter(Boolean),
  });
});

/** POST /api/engine/start { modelId } — levanta llama-server con ese modelo. */
engineRouter.post("/start", async (req, res) => {
  const modelId = typeof req.body?.modelId === "string" ? req.body.modelId : "";
  const entry = findModel(modelId);
  if (!entry) {
    res.status(400).json({ error: "modelId desconocido", available: MODEL_CATALOG.map((m) => m.id) });
    return;
  }
  try {
    const url = await localEngine.start(modelFile(entry.id));
    res.json({ ok: true, url, model: entry.id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

/** POST /api/engine/stop — apaga el motor. */
engineRouter.post("/stop", async (_req, res) => {
  await localEngine.stop();
  res.json({ ok: true });
});
