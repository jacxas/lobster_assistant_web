import { Router, Request, Response } from "express";
import { checkOllama } from "../services/ollama.js";

export const statusRouter = Router();

/** GET /api/status — returns system health */
statusRouter.get("/", async (_req: Request, res: Response) => {
  const ollama = await checkOllama();

  res.json({
    status: ollama.ok ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      ollama: {
        ok: ollama.ok,
        models: ollama.models,
        url: process.env.OLLAMA_URL || "http://localhost:11434",
      },
    },
    version: process.env.npm_package_version || "1.0.0",
  });
});
