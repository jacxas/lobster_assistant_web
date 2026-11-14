import { DEFAULT_MODEL as SHARED_DEFAULT_MODEL, DEFAULT_MAX_RESPONSE_LENGTH } from "@lobster/shared";
import { CLOUD_ENABLED, cloudChat } from "./llm.js";

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || SHARED_DEFAULT_MODEL;

/** num_predict cap sent to Ollama: OLLAMA_NUM_PREDICT env override or shared default */
function resolveNumPredict(): number {
  return parseInt(process.env.OLLAMA_NUM_PREDICT ?? "") || DEFAULT_MAX_RESPONSE_LENGTH;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
}

/** Check if Ollama is running and the model is available */
export async function checkOllama(): Promise<{ ok: boolean; models: string[] }> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) return { ok: false, models: [] };
    const data = await res.json() as { models: { name: string }[] };
    const models = data.models?.map((m) => m.name) || [];
    return { ok: true, models };
  } catch {
    return { ok: false, models: [] };
  }
}

/** Stream a chat completion from Ollama */
export async function streamChat(
  messages: ChatMessage[],
  model = DEFAULT_MODEL,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
  signal?: AbortSignal
) {
  try {
    const payload: Record<string, unknown> = { model, messages, stream: true };
    const numPredict = resolveNumPredict();
    if (Number.isInteger(numPredict) && numPredict > 0) {
      payload.options = { num_predict: numPredict };
    }

    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawDone = false;

    const consumeLine = (line: string): boolean => {
      if (!line.trim()) return false;
      try {
        const chunk = JSON.parse(line) as OllamaStreamChunk;
        if (chunk.message?.content) onChunk(chunk.message.content);
        if (chunk.done) return true;
      } catch { /* skip malformed lines */ }
      return false;
    };

    // Line-buffered: an NDJSON line can be split across TCP reads,
    // and a multibyte char can be split across chunks.
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx = buffer.indexOf("\n");
      while (newlineIdx >= 0) {
        if (consumeLine(buffer.slice(0, newlineIdx))) { sawDone = true; break; }
        buffer = buffer.slice(newlineIdx + 1);
        newlineIdx = buffer.indexOf("\n");
      }
      if (sawDone) break;
    }
    if (!sawDone) consumeLine(buffer + decoder.decode());
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/** Non-streaming chat (used by bots): uses OpenRouter when OPENROUTER_API_KEY is set, otherwise Ollama streamed internally to avoid undici's ~300s timeout on slow machines */
export async function chat(
  messages: ChatMessage[],
  model = DEFAULT_MODEL,
  signal?: AbortSignal
): Promise<string> {
  if (CLOUD_ENABLED) {
    try {
      const numPredict = resolveNumPredict();
      return await cloudChat(
        messages,
        {
          temperature: 0.6,
          ...(Number.isInteger(numPredict) && numPredict > 0 ? { maxTokens: numPredict } : {}),
        },
        signal
      );
    } catch (error) {
      if (process.env.AGENT_LOCAL_FALLBACK === "0") throw error;
      console.warn("[chat] nube falló, cayendo a Ollama local:", error instanceof Error ? error.message : error);
    }
  }

  const payload: Record<string, unknown> = { model, messages, stream: true };
  const numPredict = resolveNumPredict();
  if (Number.isInteger(numPredict) && numPredict > 0) {
    payload.options = { num_predict: numPredict };
  }

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  if (!res.body) throw new Error(`Ollama error: ${res.status} empty body`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";

  const consumeLine = (line: string): void => {
    if (!line.trim()) return;
    try {
      const chunk = JSON.parse(line) as OllamaStreamChunk;
      if (chunk.message?.content) reply += chunk.message.content;
    } catch { /* skip malformed lines */ }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIdx = buffer.indexOf("\n");
    while (newlineIdx >= 0) {
      consumeLine(buffer.slice(0, newlineIdx));
      buffer = buffer.slice(newlineIdx + 1);
      newlineIdx = buffer.indexOf("\n");
    }
  }
  consumeLine(buffer + decoder.decode());

  return reply;
}
