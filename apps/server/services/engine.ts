// Motor local propio: lanza llama-server.exe (llama.cpp) como proceso hijo silencioso.
// Sin Ollama ni servicios de terceros: el binario viaja con la app.
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const ENGINE_DIR = process.env.LOBSTER_ENGINE_DIR || path.resolve(here, "../../engine");
export const ENGINE_PORT = Number(process.env.LOBSTER_ENGINE_PORT || 8080);

export interface EngineArgsOptions {
  modelPath: string;
  port?: number;
  ctxSize?: number;
  threads?: number;
  loraPath?: string;
}

/** Argumentos de llama-server: silencioso, sin webui, con soporte de tools (--jinja). */
export function buildEngineArgs(options: EngineArgsOptions): string[] {
  const port = options.port ?? ENGINE_PORT;
  const threads = options.threads ?? Math.max(1, Math.floor(os.cpus().length / 2));
  const args = [
    "--model",
    options.modelPath,
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--ctx-size",
    String(options.ctxSize ?? 4096),
    "--threads",
    String(threads),
    "--jinja",
    "--no-webui",
    "--log-disable",
  ];
  if (options.loraPath) args.push("--lora", options.loraPath);
  return args;
}

export interface EngineStatus {
  running: boolean;
  url: string | null;
  modelPath: string | null;
  port: number;
}

export class LocalEngine {
  private child: ChildProcess | null = null;
  private modelPath: string | null = null;
  private readonly port: number;
  private readonly binaryName: string;

  constructor(options: { port?: number; binaryName?: string } = {}) {
    this.port = options.port ?? ENGINE_PORT;
    this.binaryName = options.binaryName ?? "llama-server.exe";
  }

  get url(): string {
    return `http://127.0.0.1:${this.port}/v1`;
  }

  status(): EngineStatus {
    return {
      running: this.child !== null && this.child.exitCode === null,
      url: this.child ? this.url : null,
      modelPath: this.modelPath,
      port: this.port,
    };
  }

  /** Arranca el motor con un modelo .gguf y espera a que /health responda. */
  async start(modelPath: string, options: { ctxSize?: number; loraPath?: string; binaryPath?: string } = {}): Promise<string> {
    const binary = options.binaryPath ?? path.join(ENGINE_DIR, this.binaryName);
    if (!fs.existsSync(binary)) {
      throw new Error(`falta el motor en ${binary}. Corré instalar-motor.bat o definí LOBSTER_ENGINE_DIR.`);
    }
    if (!fs.existsSync(modelPath)) {
      throw new Error(`falta el modelo: ${modelPath}`);
    }
    await this.stop();

    const args = buildEngineArgs({ modelPath, port: this.port, ctxSize: options.ctxSize, loraPath: options.loraPath });
    this.child = spawn(binary, args, {
      stdio: "ignore",
      windowsHide: true,
      cwd: path.dirname(binary),
    });
    this.modelPath = modelPath;

    this.child.once("exit", () => {
      this.child = null;
      this.modelPath = null;
    });
    process.once("exit", () => {
      try {
        this.child?.kill();
      } catch {
        /* ignorar */
      }
    });

    await this.waitForReady();
    return this.url;
  }

  private async waitForReady(timeoutMs = 120_000): Promise<void> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (!this.child) throw new Error("el motor se cerró durante el arranque");
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/health`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = (await res.json()) as { status?: string };
          if (data.status === "ok") return;
        }
      } catch {
        /* todavía cargando el modelo en RAM */
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    await this.stop();
    throw new Error("tiempo de espera agotado cargando el modelo");
  }

  async stop(): Promise<void> {
    if (this.child && this.child.exitCode === null) {
      this.child.kill();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    this.child = null;
    this.modelPath = null;
  }
}

export const localEngine = new LocalEngine();
