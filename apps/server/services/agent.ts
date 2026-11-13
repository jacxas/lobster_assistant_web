import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { DEFAULT_MODEL } from "@lobster/shared";

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_DEFAULT_MODEL = "cognitivecomputations/dolphin-mistral-24b-venice-edition:free";

const MAX_STEPS = Number(process.env.AGENT_MAX_STEPS || 6);
const OBSERVATION_LIMIT = 1500;
const COMMAND_TIMEOUT_MS = 15_000;

export type AgentEvent =
  | { type: "action"; tool: string; args: Record<string, unknown> }
  | { type: "observation"; tool: string; result: string }
  | { type: "final"; text: string };

export type AgentBrain = (messages: { role: string; content: string }[], signal?: AbortSignal) => Promise<string>;

interface Tool {
  description: string;
  args: string;
  run: (args: Record<string, unknown>) => Promise<string>;
}

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max)}… [truncado]`;

/** Comandos permitidos: primera palabra del allowlist y sin metacaracteres de shell. */
const ALLOWED_COMMANDS = new Set([
  "dir",
  "type",
  "where",
  "whoami",
  "hostname",
  "systeminfo",
  "tasklist",
  "ipconfig",
  "tree",
  "echo",
  "ver",
  "vol",
]);

const runPowerShellFree = (command: string): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(
      "cmd.exe",
      ["/c", command],
      { timeout: COMMAND_TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        const output = `${stdout}${stderr}`.trim();
        if (error && !output) reject(error);
        else resolve(output || "(sin salida)");
      }
    );
  });

export const TOOLS: Record<string, Tool> = {
  list_files: {
    description: "Lista archivos y carpetas de un directorio del PC",
    args: '{"path":"C:\\\\ruta"}',
    async run(args) {
      const target = typeof args.path === "string" && args.path.trim() ? args.path.trim() : ".";
      const absolute = path.resolve(target);
      const entries = await readdir(absolute, { withFileTypes: true });
      const shown = entries.slice(0, 100).map((entry) => {
        const kind = entry.isDirectory() ? "carpeta" : "archivo";
        return `${entry.isDirectory() ? "📁" : "📄"} ${entry.name} (${kind})`;
      });
      const extra = entries.length > 100 ? `\n… y ${entries.length - 100} más` : "";
      return `Contenido de ${absolute} (${entries.length} entradas):\n${shown.join("\n")}${extra}`;
    },
  },

  read_file: {
    description: "Lee el contenido de un archivo de texto (máximo 4 KB)",
    args: '{"path":"C:\\\\ruta\\\\archivo.txt"}',
    async run(args) {
      if (typeof args.path !== "string" || !args.path.trim()) throw new Error("falta el argumento path");
      const absolute = path.resolve(args.path.trim());
      const raw = await readFile(absolute);
      const slice = raw.subarray(0, 4096);
      const text = slice.toString("utf8");
      const nonPrintable = [...text].filter((char) => char.charCodeAt(0) < 9).length;
      if (nonPrintable > text.length * 0.1) throw new Error("el archivo parece binario; no se puede leer como texto");
      return truncate(text, 4000);
    },
  },

  run_command: {
    description: "Ejecuta un comando de Windows de la lista permitida (dir, type, where, whoami, hostname, systeminfo, tasklist, ipconfig, tree, echo, ver, vol)",
    args: '{"command":"dir C:\\\\"}',
    async run(args) {
      if (typeof args.command !== "string" || !args.command.trim()) throw new Error("falta el argumento command");
      const command = args.command.trim();
      if (!/^[A-Za-z0-9 ._:\\*\-]+$/.test(command)) {
        throw new Error("comando no permitido: contiene caracteres fuera del allowlist (sin & | > < ; comillas ni variables)");
      }
      const firstWord = command.split(/\s+/)[0].toLowerCase();
      if (!ALLOWED_COMMANDS.has(firstWord)) {
        throw new Error(`comando no permitido: "${firstWord}" no está en el allowlist`);
      }
      const output = await runPowerShellFree(command);
      return truncate(output, 4000);
    },
  },

  open_url: {
    description: "Abre una URL http/https en el navegador por defecto",
    args: '{"url":"https://ejemplo.com"}',
    async run(args) {
      if (typeof args.url !== "string") throw new Error("falta el argumento url");
      let parsed: URL;
      try {
        parsed = new URL(args.url);
      } catch {
        throw new Error("URL inválida");
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("solo se permiten URLs http/https");
      }
      await new Promise<void>((resolve, reject) => {
        execFile("cmd.exe", ["/c", "start", "", parsed.toString()], { timeout: 10_000, windowsHide: true }, (error) =>
          error ? reject(error) : resolve()
        );
      });
      return `URL abierta en el navegador: ${parsed.toString()}`;
    },
  },

  sys_info: {
    description: "Resumen del sistema (CPU, RAM, plataforma)",
    args: "{}",
    async run() {
      const cpus = os.cpus();
      const totalGb = (os.totalmem() / 1024 ** 3).toFixed(1);
      const freeGb = (os.freemem() / 1024 ** 3).toFixed(1);
      return [
        `Equipo: ${os.hostname()} (${os.platform()} ${os.arch()})`,
        `CPU: ${cpus[0]?.model ?? "desconocida"} × ${cpus.length} núcleos`,
        `RAM: ${freeGb} GB libres de ${totalGb} GB`,
        `Uptime: ${Math.round(os.uptime() / 3600)} h`,
      ].join("\n");
    },
  },
};

const buildSystemPrompt = (): string => {
  const catalog = Object.entries(TOOLS)
    .map(([name, tool]) => `- ${name}: ${tool.description} | args: ${tool.args}`)
    .join("\n");
  return [
    "Eres Lobster Agent, un asistente que opera una PC Windows con herramientas.",
    "Responde SIEMPRE con un único objeto JSON, sin texto adicional, sin markdown.",
    'Para usar una herramienta: {"action":"<nombre>","args":{...}}',
    'Para responder al usuario: {"final":"<respuesta>"}',
    "Reglas: una sola acción por respuesta; no inventes resultados; si una herramienta falla, explica el error en final o prueba otra acción.",
    "Herramientas disponibles:",
    catalog,
  ].join("\n");
};

const AGENT_SYSTEM_PROMPT = buildSystemPrompt();

/** Extrae el primer objeto JSON equilibrado de un texto (tolera markdown y ruido). */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

type ParsedStep =
  | { kind: "action"; action: string; args: Record<string, unknown> }
  | { kind: "final"; text: string }
  | null;

export function parseStep(text: string): ParsedStep {
  const candidate = extractJsonObject(text);
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    if (typeof parsed.final === "string") return { kind: "final", text: parsed.final };
    if (typeof parsed.action === "string") {
      const args = typeof parsed.args === "object" && parsed.args !== null ? (parsed.args as Record<string, unknown>) : {};
      return { kind: "action", action: parsed.action, args };
    }
    return null;
  } catch {
    return null;
  }
}

async function callOllama(messages: { role: string; content: string }[], signal?: AbortSignal): Promise<string> {
  const payload = {
    model: process.env.AGENT_MODEL || DEFAULT_MODEL,
    messages,
    stream: false,
    options: {
      num_predict: parseInt(process.env.AGENT_NUM_PREDICT ?? "") || 300,
      temperature: 0.2,
    },
  };
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

async function callOpenRouter(messages: { role: string; content: string }[], signal?: AbortSignal): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Lobster Agent",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL,
      messages,
      temperature: 0.2,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

const defaultBrain: AgentBrain = (messages, signal) =>
  process.env.OPENROUTER_API_KEY ? callOpenRouter(messages, signal) : callOllama(messages, signal);

/** Ejecuta una tarea con bucle percibir → actuar → observar. Devuelve la respuesta final. */
export async function runAgent(
  task: string,
  options: { onEvent?: (event: AgentEvent) => void; signal?: AbortSignal; brain?: AgentBrain; maxSteps?: number } = {}
): Promise<string> {
  const { onEvent = () => {}, signal, brain = defaultBrain } = options;
  const maxSteps = options.maxSteps ?? MAX_STEPS;
  const messages: { role: string; content: string }[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    { role: "user", content: `Tarea: ${task}` },
  ];

  for (let step = 1; step <= maxSteps; step++) {
    if (signal?.aborted) throw new Error("cancelado");
    const reply = (await brain(messages, signal)).trim();
    messages.push({ role: "assistant", content: reply });

    const parsed = parseStep(reply);
    if (!parsed) {
      messages.push({
        role: "user",
        content: 'FORMATO INVÁLIDO. Responde SOLO con JSON válido: {"action":"...","args":{...}} o {"final":"..."}',
      });
      continue;
    }
    if (parsed.kind === "final") {
      onEvent({ type: "final", text: parsed.text });
      return parsed.text;
    }

    const tool = TOOLS[parsed.action];
    if (!tool) {
      messages.push({ role: "user", content: `Herramienta desconocida: ${parsed.action}. Usa solo las del catálogo.` });
      continue;
    }

    onEvent({ type: "action", tool: parsed.action, args: parsed.args });
    let result: string;
    try {
      result = await tool.run(parsed.args);
    } catch (error) {
      result = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
    }
    const summary = truncate(result, OBSERVATION_LIMIT);
    onEvent({ type: "observation", tool: parsed.action, result: summary });
    messages.push({ role: "user", content: `RESULTADO de ${parsed.action}:\n${summary}` });

    if (step === maxSteps) {
      messages.push({ role: "user", content: "Último paso. Responde ahora con {\"final\":\"...\"} usando lo observado." });
    }
  }
  throw new Error(`el agente no terminó en ${maxSteps} pasos`);
}
