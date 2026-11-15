import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { DEFAULT_MODEL } from "@lobster/shared";
import { CLOUD_ENABLED, VISION_MODEL, cloudChat, cloudCompletion, fetchWithRetry } from "./llm.js";
import { browserClick, browserClose, browserOpen, browserRead, browserType } from "./browser.js";
import { evaluateTool } from "./permissions.js";

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";

export const MAX_STEPS = Number(process.env.AGENT_MAX_STEPS || 8);
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

/** Convierte HTML en texto plano legible (sin scripts, estilos ni etiquetas). */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const SCREENSHOT_PATH = path.join(os.tmpdir(), "lobster-screenshot.png").replace(/\\/g, "/");
const GRID_SCREENSHOT_PATH = path.join(os.tmpdir(), "lobster-screenshot-grid.png").replace(/\\/g, "/");

/** Captura la pantalla completa a un PNG y devuelve "ANCHOxALTO". */
function captureScreen(): Promise<string> {
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "Add-Type -AssemblyName System.Drawing",
    "$b=[System.Windows.Forms.SystemInformation]::VirtualScreen",
    "$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height",
    "$g=[System.Drawing.Graphics]::FromImage($bmp)",
    "$g.CopyFromScreen($b.Left,$b.Top,0,0,$bmp.Size)",
    `$bmp.Save('${SCREENSHOT_PATH}',[System.Drawing.Imaging.ImageFormat]::Png)`,
    "$g.Dispose();$bmp.Dispose()",
    'Write-Output "$($b.Width)x$($b.Height)"',
  ].join("; ");
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-Command", script], { timeout: 20_000, windowsHide: true }, (error, stdout) => {
      if (error) reject(error);
      else resolve(String(stdout).trim());
    });
  });
}

/** Superpone una rejilla con etiquetas de coordenadas a la última captura (set-of-marks básico). */
function overlayGrid(): Promise<void> {
  const script = [
    "Add-Type -AssemblyName System.Drawing",
    `$bmp=[System.Drawing.Image]::FromFile('${SCREENSHOT_PATH}')`,
    "$g=[System.Drawing.Graphics]::FromImage($bmp)",
    "$pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90,255,60,60),1)",
    "$font=New-Object System.Drawing.Font('Arial',9,[System.Drawing.FontStyle]::Bold)",
    "$brush=[System.Drawing.Brushes]::Yellow",
    "$bg=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170,0,0,0))",
    "for($x=0;$x -lt $bmp.Width;$x+=100){$g.DrawLine($pen,$x,0,$x,$bmp.Height);if($x % 200 -eq 0){$g.FillRectangle($bg,$x+1,1,28,12);$g.DrawString($x,$font,$brush,$x+2,0)}}",
    "for($y=0;$y -lt $bmp.Height;$y+=100){$g.DrawLine($pen,0,$y,$bmp.Width,$y);if($y % 200 -eq 0){$g.FillRectangle($bg,1,$y+1,28,12);$g.DrawString($y,$font,$brush,2,$y+1)}}",
    `$bmp.Save('${GRID_SCREENSHOT_PATH}',[System.Drawing.Imaging.ImageFormat]::Png)`,
    "$g.Dispose();$bmp.Dispose()",
  ].join("; ");
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-Command", script], { timeout: 25_000, windowsHide: true }, (error) =>
      error ? reject(error) : resolve()
    );
  });
}

/** Pregunta a un modelo de visión (OpenRouter) sobre la última captura. */
async function askVision(question: string, imagePath: string = SCREENSHOT_PATH, signal?: AbortSignal): Promise<string> {
  if (!CLOUD_ENABLED) throw new Error("la visión necesita LLM_API_KEY (no hay VLM local viable en esta PC)");
  const base64 = (await readFile(imagePath)).toString("base64");
  const data = await cloudCompletion(
    {
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question },
            { type: "image_url", image_url: { url: `data:image/png;base64,${base64}` } },
          ],
        },
      ],
      max_tokens: 800,
    },
    signal
  );
  return data.choices?.[0]?.message?.content ?? "";
}

/** Clic izquierdo real en coordenadas absolutas (requiere AGENT_ALLOW_CLICKS=1). */
function clickAt(x: number, y: number): Promise<void> {
  const script = [
    "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class LobsterMouse{[DllImport(\"user32.dll\")]public static extern bool SetCursorPos(int x,int y);[DllImport(\"user32.dll\")]public static extern void mouse_event(uint f,uint dx,uint dy,uint d,UIntPtr e);}';",
    `[LobsterMouse]::SetCursorPos(${x},${y})`,
    "[LobsterMouse]::mouse_event(0x0002,0,0,0,[UIntPtr]::Zero)",
    "[LobsterMouse]::mouse_event(0x0004,0,0,0,[UIntPtr]::Zero)",
  ].join("; ");
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-Command", script], { timeout: 15_000, windowsHide: true }, (error) =>
      error ? reject(error) : resolve()
    );
  });
}

/** Escribe texto en la ventana activa vía portapapeles + Ctrl+V. */
function typeText(text: string): Promise<void> {
  const base64 = Buffer.from(text, "utf8").toString("base64");
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    `$t=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${base64}'))`,
    "Set-Clipboard -Value $t",
    "[System.Windows.Forms.SendKeys]::SendWait('^v')",
  ].join("; ");
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-Command", script], { timeout: 20_000, windowsHide: true }, (error) =>
      error ? reject(error) : resolve()
    );
  });
}

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

  screenshot: {
    description: "Captura la pantalla actual a un PNG en disco y devuelve la ruta",
    args: "{}",
    async run() {
      const size = await captureScreen();
      return `Captura guardada en ${SCREENSHOT_PATH} (${size} px)`;
    },
  },

  look: {
    description: "Mira la pantalla con un modelo de visión y responde una pregunta sobre lo que se ve (p. ej. coordenadas de un botón). Envía la captura a OpenRouter. Acepta {question, grid?:true} para superponer rejilla de coordenadas.",
    args: '{"question":"¿Dónde está el botón Guardar? Responde x,y"}',
    async run(args) {
      if (typeof args.question !== "string" || !args.question.trim()) throw new Error("falta el argumento question");
      const size = await captureScreen();
      const useGrid = args.grid === true;
      if (useGrid) await overlayGrid();
      const contextual = useGrid
        ? `${args.question.trim()}\n\n(La imagen mide exactamente ${size} píxeles y tiene una rejilla superpuesta: ` +
          "líneas cada 100 px y etiquetas de coordenadas en amarillo cada 200 px. " +
          "Si te piden la posición de un elemento, delimítalo usando la rejilla y responde SOLO un JSON válido " +
          '{"x":<centro_x>,"y":<centro_y>,"x1":<izq>,"y1":<arriba>,"x2":<der>,"y2":<abajo>} en esa resolución.)'
        : `${args.question.trim()}\n\n(La imagen mide exactamente ${size} píxeles. ` +
          'Si te piden coordenadas, responde SOLO un JSON válido {"x":<numero>,"y":<numero>} en esa resolución.)';
      const answer = await askVision(contextual, useGrid ? GRID_SCREENSHOT_PATH : SCREENSHOT_PATH);
      return truncate(answer, 1200);
    },
  },

  click: {
    description: "Clic izquierdo en coordenadas de pantalla (requiere AGENT_ALLOW_CLICKS=1; si no, solo muestra la vista previa)",
    args: '{"x":100,"y":200}',
    async run(args) {
      const x = Number(args.x);
      const y = Number(args.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 20000 || y > 20000) {
        throw new Error("coordenadas inválidas");
      }
      if (process.env.AGENT_ALLOW_CLICKS !== "1") {
        return `VISTA PREVIA: el clic iría a (${Math.round(x)}, ${Math.round(y)}). Para ejecutarlo de verdad define AGENT_ALLOW_CLICKS=1 y reinicia el server.`;
      }
      await clickAt(Math.round(x), Math.round(y));
      return `Clic ejecutado en (${Math.round(x)}, ${Math.round(y)}).`;
    },
  },

  type_text: {
    description: "Escribe texto en la ventana activa (requiere AGENT_ALLOW_CLICKS=1; si no, solo muestra vista previa)",
    args: '{"text":"hola mundo"}',
    async run(args) {
      if (typeof args.text !== "string" || !args.text) throw new Error("falta el argumento text");
      if (process.env.AGENT_ALLOW_CLICKS !== "1") {
        return `VISTA PREVIA: se escribiría "${truncate(args.text, 80)}". Para hacerlo de verdad define AGENT_ALLOW_CLICKS=1 y reinicia el server.`;
      }
      await typeText(args.text);
      return `Texto escrito (${args.text.length} caracteres).`;
    },
  },

  fetch_url: {
    description: "Descarga una página web (http/https) y devuelve su texto limpio, máximo 4000 caracteres",
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
      const res = await fetchWithRetry(parsed.toString(), {
        headers: { "User-Agent": "LobsterAgent/1.0" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`la página respondió ${res.status}`);
      const raw = await res.text();
      const text = stripHtml(raw);
      if (!text) return "(la página no tiene texto extraíble)";
      return truncate(text, 4000);
    },
  },

  clipboard_get: {
    description: "Lee el contenido del portapapeles de Windows (máx 2000 caracteres)",
    args: "{}",
    async run() {
      const text = await new Promise<string>((resolve, reject) => {
        execFile(
          "powershell.exe",
          ["-NoProfile", "-Command", "Get-Clipboard -Raw"],
          { timeout: 15_000, windowsHide: true, maxBuffer: 1024 * 1024 },
          (error, stdout) => (error ? reject(error) : resolve(String(stdout)))
        );
      });
      return truncate(text.trim() || "(portapapeles vacío)", 2000);
    },
  },

  clipboard_set: {
    description: "Copia un texto al portapapeles de Windows",
    args: '{"text":"hola"}',
    async run(args) {
      if (typeof args.text !== "string" || !args.text) throw new Error("falta el argumento text");
      const base64 = Buffer.from(args.text, "utf8").toString("base64");
      const script = `$t=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${base64}')); Set-Clipboard -Value $t`;
      await new Promise<void>((resolve, reject) => {
        execFile("powershell.exe", ["-NoProfile", "-Command", script], { timeout: 15_000, windowsHide: true }, (error) =>
          error ? reject(error) : resolve()
        );
      });
      return "Texto copiado al portapapeles.";
    },
  },

  browser_open: {
    description: "Abre una URL en un navegador headless AISLADO (perfil nuevo, sin logins ni cookies del usuario) y devuelve título y texto",
    args: '{"url":"https://ejemplo.com"}',
    async run(args) {
      if (typeof args.url !== "string" || !args.url.trim()) throw new Error("falta el argumento url");
      return truncate(await browserOpen(args.url.trim()), 3500);
    },
  },

  browser_read: {
    description: "Devuelve el título y el texto de la página actual del navegador aislado",
    args: "{}",
    async run() {
      return truncate(await browserRead(), 3500);
    },
  },

  browser_click: {
    description: "Clic en un elemento del navegador aislado por selector CSS o texto visible (AGENT_ALLOW_BROWSER=0 lo deja en vista previa)",
    args: '{"target":"Aceptar"}',
    async run(args) {
      if (typeof args.target !== "string" || !args.target.trim()) throw new Error("falta el argumento target");
      if (process.env.AGENT_ALLOW_BROWSER === "0") {
        return `VISTA PREVIA: clic en "${args.target}" (define AGENT_ALLOW_BROWSER=1 para ejecutarlo).`;
      }
      return await browserClick(args.target.trim());
    },
  },

  browser_type: {
    description: "Escribe texto en un campo del navegador aislado por selector/placeholder/label (AGENT_ALLOW_BROWSER=0 lo deja en vista previa)",
    args: '{"target":"input[name=q]","text":"hola"}',
    async run(args) {
      if (typeof args.target !== "string" || typeof args.text !== "string") throw new Error("faltan target y text");
      if (process.env.AGENT_ALLOW_BROWSER === "0") {
        return `VISTA PREVIA: escribir "${truncate(args.text, 60)}" en "${args.target}".`;
      }
      return await browserType(args.target.trim(), args.text);
    },
  },

  browser_close: {
    description: "Cierra el navegador headless aislado",
    args: "{}",
    async run() {
      return await browserClose();
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
  const res = await fetchWithRetry(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

async function callCloud(messages: { role: string; content: string }[], signal?: AbortSignal): Promise<string> {
  return cloudChat(messages, { temperature: 0.2 }, signal);
}

const defaultBrain: AgentBrain = async (messages, signal) => {
  if (!CLOUD_ENABLED) return callOllama(messages, signal);
  try {
    return await callCloud(messages, signal);
  } catch (error) {
    if (process.env.AGENT_LOCAL_FALLBACK === "0") throw error;
    console.warn("[agent] nube falló, cayendo a Ollama local:", error instanceof Error ? error.message : error);
    return callOllama(messages, signal);
  }
};

/** Ejecuta una tarea con bucle percibir → actuar → observar. Devuelve la respuesta final. */
export async function runAgent(
  task: string,
  options: { onEvent?: (event: AgentEvent) => void; signal?: AbortSignal; brain?: AgentBrain; maxSteps?: number; context?: string } = {}
): Promise<string> {
  const { onEvent = () => {}, signal, brain = defaultBrain } = options;
  const maxSteps = options.maxSteps ?? MAX_STEPS;
  const messages: { role: string; content: string }[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    {
      role: "user",
      content: options.context
        ? `Tarea: ${task}\n\nContexto reciente de la sesión (referencia; no lo repitas):\n${options.context}`
        : `Tarea: ${task}`,
    },
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
    const verdict = evaluateTool(parsed.action, parsed.args);
    if (verdict.decision === "block") {
      result = `BLOQUEADO por política de permisos: ${verdict.reasons.join("; ")}`;
    } else if (verdict.decision === "require_confirmation") {
      result = `REQUIERE CONFIRMACIÓN HUMANA: ${verdict.reasons.join("; ")}`;
    } else {
      try {
        result = await tool.run(parsed.args);
      } catch (error) {
        result = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
      }
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
