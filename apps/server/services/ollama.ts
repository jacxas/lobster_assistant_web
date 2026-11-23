import { DEFAULT_MODEL as SHARED_DEFAULT_MODEL, DEFAULT_MAX_RESPONSE_LENGTH, SYSTEM_PROMPT } from "@lobster/shared";
import { cloudChat, cloudEnabled, getBrain } from "./llm.js";

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || SHARED_DEFAULT_MODEL;

// En una CPU como la de esta PC el motor propio rinde ~0,15-0,35 tok/s: con el
// tope por defecto (500) una respuesta tardaría ~45 min y parecería colgada.
// En local se limita la salida para que conteste en 1-2 frases.
const LOCAL_MAX_TOKENS = parseInt(process.env.LOCAL_MAX_TOKENS ?? "") || 48;

/** num_predict cap sent to Ollama: OLLAMA_NUM_PREDICT env override or shared default */
function resolveNumPredict(): number {
  return parseInt(process.env.OLLAMA_NUM_PREDICT ?? "") || DEFAULT_MAX_RESPONSE_LENGTH;
}

/** Tope de tokens de salida según el cerebro activo. */
function resolveMaxTokens(): number {
  const base = resolveNumPredict();
  return getBrain().mode === "local" ? Math.min(base, LOCAL_MAX_TOKENS) : base;
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

/** Modelo a usar: el que pida el cliente o el del cerebro activo. */
const resolverModelo = (model?: string): string => {
  const brain = getBrain();
  if (!model || model === DEFAULT_MODEL || model === "local") return brain.model;
  return model;
};

let warming = false;

/** true mientras el motor local está procesando el prompt inicial. */
export function isWarming(): boolean {
  return warming;
}

/** Instrucción extra cuando el cerebro es el motor local (CPU lenta). */
export const LOCAL_BREVITY_PROMPT =
  "Estás corriendo en una CPU muy lenta: responde en una sola frase corta (máximo 20 palabras) y sin listas.";

/**
 * Precalienta el caché de prompt del motor local.
 * En esta CPU procesar el system prompt desde cero cuesta ~3 minutos; si se
 * hace al cambiar a local, el primer mensaje real del usuario tarda segundos.
 */
export async function warmupLocal(baseUrl: string): Promise<void> {
  warming = true;
  try {
    await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "local",
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\n${LOCAL_BREVITY_PROMPT}` },
          { role: "user", content: "hola" },
        ],
        max_tokens: 1,
        temperature: 0,
      }),
      // Sin abort: si se corta a mitad, llama.cpp sigue procesando y el motor
      // queda ocupado minutos, encolando los mensajes reales del usuario.
      signal: AbortSignal.timeout(900_000),
    });
  } catch {
    /* el precalentado es best-effort: si falla, el primer mensaje solo tarda más */
  } finally {
    warming = false;
  }
}

/**
 * Streaming de chat contra el cerebro activo (protocolo OpenAI: nube o motor
 * propio). Antes hablaba solo con Ollama, que ya no se usa: el chat del panel
 * devolvía "fetch failed" con ECONNREFUSED en :11434.
 */
export async function streamChat(
  messages: ChatMessage[],
  model: string | undefined = undefined,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
  signal?: AbortSignal
) {
  const brain = getBrain();
  const numPredict = resolveMaxTokens();

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (brain.apiKey) headers.Authorization = `Bearer ${brain.apiKey}`;

    const res = await fetch(`${brain.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: resolverModelo(model),
        messages,
        stream: true,
        temperature: 0.6,
        ...(Number.isInteger(numPredict) && numPredict > 0 ? { max_tokens: numPredict } : {}),
      }),
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Proveedor ${res.status} ${res.statusText}`.trim());
    }

    // Algunos proveedores ignoran stream:true y devuelven JSON completo.
    const tipo = res.headers.get("content-type") || "";
    if (!tipo.includes("event-stream")) {
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const texto = data.choices?.[0]?.message?.content || "";
      if (texto) onChunk(texto);
      onDone();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let terminado = false;

    const consumirLinea = (line: string): void => {
      const limpia = line.trim();
      if (!limpia.startsWith("data:")) return;
      const payload = limpia.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
        const texto = chunk.choices?.[0]?.delta?.content;
        if (texto) onChunk(texto);
      } catch {
        /* línea malformada: se ignora */
      }
    };

    while (!terminado) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx = buffer.indexOf("\n");
      while (idx >= 0) {
        consumirLinea(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 1);
        idx = buffer.indexOf("\n");
      }
      if (signal?.aborted) {
        terminado = true;
      }
    }
    if (buffer) consumirLinea(buffer + decoder.decode());
    try {
      await reader.cancel();
    } catch {
      /* ya cerrado */
    }
    onDone();
  } catch (err) {
    // Si el usuario cortó, no se reporta error: se conserva lo recibido.
    if (signal?.aborted) {
      onDone();
      return;
    }
    // Sin streaming, intentamos una respuesta completa antes de rendirnos.
    try {
      const texto = await cloudChat(
        messages,
        { temperature: 0.6, ...(Number.isInteger(numPredict) && numPredict > 0 ? { maxTokens: numPredict } : {}) },
        signal
      );
      if (texto) onChunk(texto);
      onDone();
    } catch (err2) {
      onError(err2 instanceof Error ? err2 : new Error(String(err)));
    }
  }
}

/** Non-streaming chat (used by bots): uses OpenRouter when OPENROUTER_API_KEY is set, otherwise Ollama streamed internally to avoid undici's ~300s timeout on slow machines */
export async function chat(
  messages: ChatMessage[],
  model = DEFAULT_MODEL,
  signal?: AbortSignal
): Promise<string> {
  if (cloudEnabled()) {
    try {
      const numPredict = resolveMaxTokens();
      return await cloudChat(
        messages,
        {
          temperature: 0.6,
          ...(Number.isInteger(numPredict) && numPredict > 0 ? { maxTokens: numPredict } : {}),
        },
        signal
      );
    } catch (error) {
      // Si el cerebro ES el motor local, no hay nada más a lo que caer.
      if (getBrain().mode === "local" || signal?.aborted) throw error;
      if (process.env.AGENT_LOCAL_FALLBACK === "0") throw error;
      console.warn("[chat] nube falló, cayendo a motor local:", error instanceof Error ? error.message : error);
    }
  }

  const payload: Record<string, unknown> = { model, messages, stream: true };
  const numPredict = resolveMaxTokens();
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
