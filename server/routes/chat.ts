import { Router, Request, Response } from "express";
import { z } from "zod";
import { sessionMiddleware } from "../middleware/session.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { streamChat, chat, ChatMessage } from "../services/ollama.js";

export const chatRouter = Router();
chatRouter.use(sessionMiddleware);
chatRouter.use(chatLimiter);

const ChatBodySchema = z.object({
  message: z.string().min(1).max(8000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).optional().default([]),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
  userId: z.string().optional(),
  platform: z.enum(["discord", "telegram", "whatsapp", "web"]).optional().default("web"),
});

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ||
  "You are Lobster, a helpful AI assistant. Be concise and friendly.";

/** POST /api/chat
 *  Supports both streaming (SSE) and non-streaming (JSON) modes.
 */
chatRouter.post("/", async (req: Request, res: Response) => {
  const parsed = ChatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { message, history, model, stream, platform } = parsed.data;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  // Non-streaming mode (used by bots)
  if (!stream || platform !== "web") {
    try {
      const reply = await chat(messages, model);
      res.json({ reply, platform });
    } catch (err) {
      console.error("[chat] error:", err);
      res.status(502).json({ error: "AI service unavailable" });
    }
    return;
  }

  // Streaming mode (SSE) for web client
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  await streamChat(
    messages,
    model,
    (text) => sendEvent("chunk", { text }),
    () => { sendEvent("done", {}); res.end(); },
    (err) => { sendEvent("error", { message: err.message }); res.end(); }
  );
});
