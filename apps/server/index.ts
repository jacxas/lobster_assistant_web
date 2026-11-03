import express, { type Express, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MODEL, SYSTEM_PROMPT } from "@lobster/shared/const";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || DEFAULT_MODEL;

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/api/status", (req: Request, res: Response) => {
  res.json({
    status: "online",
    runtime: "lobster-assistant",
    version: "1.0.0",
    model: OLLAMA_MODEL,
    timestamp: new Date().toISOString(),
  });
});

type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

// Chat endpoint backed by the local Ollama runtime
app.post("/api/chat", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const incoming: ChatTurn[] = Array.isArray(body.messages)
    ? body.messages
    : typeof body.message === "string"
      ? [{ role: "user", content: body.message }]
      : [];

  const conversation = incoming
    .filter((m) => m && typeof m.content === "string" && ["user", "assistant", "system"].includes(m.role))
    .map((m) => ({ role: m.role, content: m.content }));

  if (!conversation.some((m) => m.role === "user" && m.content.trim())) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const messages = conversation.some((m) => m.role === "system")
    ? conversation
    : [{ role: "system" as const, content: SYSTEM_PROMPT }, ...conversation];

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      res.status(502).json({ error: `Ollama responded with ${response.status}. ${detail}` });
      return;
    }

    const data = (await response.json()) as {
      message?: { content?: string };
      response?: string;
      model?: string;
    };
    const reply = data.message?.content?.trim() || data.response?.trim();

    if (!reply) {
      res.status(502).json({ error: "Ollama returned an empty response." });
      return;
    }

    res.json({ response: reply, model: data.model ?? OLLAMA_MODEL, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Ollama chat failed:", error);
    res.status(503).json({
      error: `The local Ollama runtime is not reachable at ${OLLAMA_URL}. Check that the "ollama" service is running and the "${OLLAMA_MODEL}" model is pulled.`,
    });
  }
});

// Serve static files from public directory (web app build)
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // SPA fallback: serve index.html for all non-API routes
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🦞 Lobster Assistant server running on http://localhost:${PORT}`);
  console.log(`🧠 Ollama runtime: ${OLLAMA_URL} (model: ${OLLAMA_MODEL})`);
  if (fs.existsSync(publicDir)) {
    console.log(`📱 Web app served from ${publicDir}`);
  }
});
