// Proveedor de nube agnóstico (protocolo OpenAI). Cambiás LLM_BASE_URL/LLM_API_KEY/LLM_MODEL
// y funciona con OpenRouter, Google AI Studio (Gemini), Groq, Cerebras o Cloudflare.
const stripTrailing = (url: string) => url.replace(/\/+$/, "");

export const CLOUD_BASE = stripTrailing(
  process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1"
);
export const CLOUD_KEY = process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || "";
export const CLOUD_MODEL =
  process.env.LLM_MODEL || process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
export const VISION_MODEL =
  process.env.LLM_VISION_MODEL || process.env.AGENT_VISION_MODEL || "nvidia/nemotron-3.5-super-vl:free";
export const CLOUD_ENABLED = Boolean(CLOUD_KEY);

// ── Override en caliente (selector de cerebro del panel) ──
export interface BrainConfig {
  mode: "cloud" | "local";
  baseUrl: string;
  apiKey: string;
  model: string;
  visionModel: string;
}

let override: BrainConfig | null = null;

/** Configuración efectiva del cerebro (override del panel o variables de entorno). */
export function getBrain(): BrainConfig {
  if (override) return override;
  return { mode: "cloud", baseUrl: CLOUD_BASE, apiKey: CLOUD_KEY, model: CLOUD_MODEL, visionModel: VISION_MODEL };
}

/** Cambia el cerebro en caliente: modo local (motor propio) o nube. */
export function setBrain(config: BrainConfig): void {
  override = config;
}

/** Vuelve a la configuración de entorno (nube por defecto). */
export function clearBrain(): void {
  override = null;
}

export function cloudEnabled(): boolean {
  return Boolean(getBrain().apiKey);
}

/** fetch con reintentos ante 429/5xx y errores de red (tiers gratuitos). */
export async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed");
}

interface CloudChoice {
  message?: { content?: string };
}

/** POST /chat/completions al proveedor configurado; devuelve el JSON parseado. */
export async function cloudCompletion(
  payload: Record<string, unknown>,
  signal?: AbortSignal
): Promise<{ choices?: CloudChoice[] }> {
  const brain = getBrain();
  if (!brain.apiKey) throw new Error("sin LLM_API_KEY configurada");
  const res = await fetchWithRetry(`${brain.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${brain.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Lobster",
    },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error(`Proveedor LLM respondió ${res.status} ${res.statusText}`);
  return (await res.json()) as { choices?: CloudChoice[] };
}

/** Chat de texto simple sobre el proveedor configurado. */
export async function cloudChat(
  messages: { role: string; content: unknown }[],
  opts: { temperature?: number; maxTokens?: number; model?: string; jsonMode?: boolean } = {},
  signal?: AbortSignal
): Promise<string> {
  const brain = getBrain();
  const data = await cloudCompletion(
    {
      model: opts.model || brain.model,
      messages,
      temperature: opts.temperature ?? 0.2,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      // En modo local forzamos JSON válido: los modelos chicos se pierden
      // con las 23 herramientas y rompen el protocolo del agente.
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    },
    signal
  );
  return data.choices?.[0]?.message?.content ?? "";
}
