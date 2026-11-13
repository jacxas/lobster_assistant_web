import { Router, Request, Response } from "express";
import { z } from "zod";
import { SYSTEM_PROMPT as LOBSTER_PERSONA } from "@lobster/shared";
import { sessionMiddleware } from "../middleware/session.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { streamChat, chat, ChatMessage } from "../services/ollama.js";
import { saveMessage, getHistory, clearHistory } from "../db/messages.js";
import { upsertSession } from "../db/sessions.js";

export const chatRouter: Router = Router();
chatRouter.use(sessionMiddleware);
chatRouter.use(chatLimiter);

const ChatBodySchema = z.object({
  message: z.string().min(1).max(8000),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
  platform: z.enum(["discord", "telegram", "whatsapp", "slack", "web"]).optional().default("web"),
  // Bots: id de chat de la plataforma -> sesión persistente "platform:chatId"
  chatId: z.string().min(1).max(200).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).optional(),
});

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || LOBSTER_PERSONA;

/** POST /api/chat */
chatRouter.post("/", async (req: Request, res: Response) => {
  const parsed = ChatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { message, model, stream, platform, chatId, history: clientHistory } = parsed.data;

  // Web: sesión por cookie. Bots: sesión derivada "platform:chatId".
  let sessionId = req.sessionId;
  if (platform !== "web" && chatId) {
    sessionId = `${platform}:${chatId}`;
    upsertSession(sessionId, { platform });
  }

  const dbHistory = clientHistory ? [] : getHistory(sessionId, 20);
  const history = clientHistory ?? dbHistory;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  if (!stream || platform !== "web") {
    const abort = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) abort.abort();
    });
    try {
      const reply = await chat(messages, model, abort.signal);
      saveMessage(sessionId, "user", message, model);
      saveMessage(sessionId, "assistant", reply, model);
      res.json({ reply, platform });
    } catch (err) {
      console.error("[chat] error:", err);
      res.status(502).json({ error: "AI service unavailable" });
    }
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Abort the Ollama generation when the client disconnects (e.g. Stop button)
  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abort.abort();
  });

  const sendEvent = (event: string, data: unknown) => {
    if (res.destroyed) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // connection already gone
    }
  };

  let fullReply = "";

  await streamChat(
    messages,
    model,
    (text) => {
      fullReply += text;
      sendEvent("chunk", { text });
    },
    () => {
      saveMessage(sessionId, "user", message, model);
      saveMessage(sessionId, "assistant", fullReply, model);
      sendEvent("done", {});
      res.end();
    },
    (err) => {
      sendEvent("error", { message: err.message });
      res.end();
    },
    abort.signal
  );
});

/** DELETE /api/chat/history — clear conversation for current session */
chatRouter.delete("/history", (req: Request, res: Response) => {
  clearHistory(req.sessionId);
  res.json({ ok: true });
});
