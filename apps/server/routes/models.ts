import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { mkdir, rm, stat } from "node:fs/promises";
import { downloadModel } from "../services/models.js";
import { MODEL_CATALOG, findModel } from "../services/modelCatalog.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = process.env.LOBSTER_MODELS_DIR || path.resolve(here, "../../.data/models");

const fileSize = async (file: string): Promise<number | null> => {
  try {
    return (await stat(file)).size;
  } catch {
    return null;
  }
};

export const modelsRouter: Router = Router();

/** GET /api/models — catálogo curado + estado local (instalado o no). */
modelsRouter.get("/", async (_req, res) => {
  const models = await Promise.all(
    MODEL_CATALOG.map(async (entry) => {
      const file = path.join(MODELS_DIR, `${entry.id}.gguf`);
      const partial = await fileSize(`${file}.part`);
      const installed = (await fileSize(file)) !== null;
      return {
        ...entry,
        installed,
        downloading: partial !== null,
        downloadedBytes: partial ?? undefined,
      };
    })
  );
  res.json({ modelsDir: MODELS_DIR, models });
});

/** POST /api/models/:id/download — descarga con progreso por SSE. */
modelsRouter.post("/:id/download", async (req, res) => {
  const entry = findModel(req.params.id);
  if (!entry) {
    res.status(404).json({ error: "modelo desconocido" });
    return;
  }
  await mkdir(MODELS_DIR, { recursive: true });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    if (res.destroyed) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      /* conexión cerrada */
    }
  };

  let lastSent = 0;
  try {
    const file = await downloadModel(entry, MODELS_DIR, {
      onProgress: (received, total) => {
        const now = Date.now();
        if (now - lastSent < 800) return;
        lastSent = now;
        send("progress", { received, total, pct: total > 0 ? Math.round((received / total) * 100) : null });
      },
    });
    send("done", { path: file });
  } catch (error) {
    send("error", { message: error instanceof Error ? error.message : String(error) });
  } finally {
    res.end();
  }
});

/** DELETE /api/models/:id — borra el modelo del disco. */
modelsRouter.delete("/:id", async (req, res) => {
  const entry = findModel(req.params.id);
  if (!entry) {
    res.status(404).json({ error: "modelo desconocido" });
    return;
  }
  const file = path.join(MODELS_DIR, `${entry.id}.gguf`);
  await rm(file, { force: true });
  await rm(`${file}.part`, { force: true });
  res.json({ ok: true, deleted: entry.id });
});
