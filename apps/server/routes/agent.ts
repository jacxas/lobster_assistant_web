import { Router } from "express";
import { z } from "zod";
import { sessionMiddleware } from "../middleware/session.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { runAgent } from "../services/agent.js";

export const agentRouter: Router = Router();
agentRouter.use(sessionMiddleware);
agentRouter.use(chatLimiter);

const AgentBodySchema = z.object({
  task: z.string().min(1).max(2000),
  stream: z.boolean().optional().default(true),
});

/** POST /api/agent — ejecuta una tarea con bucle de herramientas. */
agentRouter.post("/", async (req, res) => {
  const parsed = AgentBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const { task, stream } = parsed.data;

  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abort.abort();
  });

  if (!stream) {
    try {
      const answer = await runAgent(task, { signal: abort.signal });
      res.json({ answer });
    } catch (error) {
      console.error("[agent] error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "agent failed" });
    }
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    if (res.destroyed) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // conexión ya cerrada
    }
  };

  try {
    const answer = await runAgent(task, {
      signal: abort.signal,
      onEvent: (event) => {
        if (event.type === "action") {
          sendEvent("chunk", { text: `\n🔧 ${event.tool} ${JSON.stringify(event.args)}\n` });
        } else if (event.type === "observation") {
          sendEvent("chunk", { text: `↳ ${event.result}\n` });
        }
      },
    });
    sendEvent("chunk", { text: `\n${answer}` });
    sendEvent("done", {});
  } catch (error) {
    sendEvent("error", { message: error instanceof Error ? error.message : String(error) });
  } finally {
    res.end();
  }
});
