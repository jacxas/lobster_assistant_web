// Descargador de modelos GGUF: manifest + descarga reanudable + verificación sha256.
// El instalador queda liviano (5 MB) y baja el modelo desde almacenamiento estático
// (Hugging Face / Cloudflare R2 / GitHub Releases) en segundo plano.
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

export interface ModelEntry {
  id: string;
  name: string;
  url: string;
  sha256: string;
  sizeBytes?: number;
  contextLength?: number;
  notes?: string;
}

export interface ModelManifest {
  version: string;
  models: Record<string, ModelEntry>;
}

const SHA_RE = /^[a-f0-9]{64}$/i;

/** Valida y normaliza un manifest.json del catálogo de modelos. */
export function parseManifest(raw: string): ModelManifest {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("manifest inválido: no es JSON");
  }
  const manifest = data as Partial<ModelManifest>;
  if (!manifest.version || typeof manifest.version !== "string") throw new Error("manifest inválido: falta version");
  if (!manifest.models || typeof manifest.models !== "object") throw new Error("manifest inválido: falta models");

  const models: Record<string, ModelEntry> = {};
  for (const [key, value] of Object.entries(manifest.models)) {
    const entry = value as Partial<ModelEntry>;
    if (!entry.url || typeof entry.url !== "string") throw new Error(`modelo ${key}: falta url`);
    if (!entry.sha256 || !SHA_RE.test(entry.sha256)) throw new Error(`modelo ${key}: sha256 inválido`);
    if (!/^https?:\/\//i.test(entry.url)) throw new Error(`modelo ${key}: url debe ser http/https`);
    models[key] = {
      id: key,
      name: entry.name ?? key,
      url: entry.url,
      sha256: entry.sha256.toLowerCase(),
      sizeBytes: entry.sizeBytes,
      contextLength: entry.contextLength,
      notes: entry.notes,
    };
  }
  if (Object.keys(models).length === 0) throw new Error("manifest inválido: sin modelos");
  return { version: manifest.version, models };
}

export async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export interface DownloadOptions {
  onProgress?: (received: number, total: number) => void;
  signal?: AbortSignal;
}

const fileSize = async (filePath: string): Promise<number | null> => {
  try {
    return (await stat(filePath)).size;
  } catch {
    return null;
  }
};

/**
 * Descarga un modelo a `destDir` de forma reanudable (Range) y verifica sha256.
 * Si el archivo final ya existe y el hash coincide, no descarga nada.
 */
export async function downloadModel(entry: ModelEntry, destDir: string, options: DownloadOptions = {}): Promise<string> {
  await mkdir(destDir, { recursive: true });
  const finalPath = path.join(destDir, `${entry.id}.gguf`);
  const partPath = `${finalPath}.part`;

  const existingSize = await fileSize(finalPath);
  if (existingSize !== null) {
    if ((await sha256File(finalPath)) === entry.sha256) return finalPath;
    await rm(finalPath, { force: true });
  }

  const resumeFrom = (await fileSize(partPath)) ?? 0;
  const headers: Record<string, string> = { "User-Agent": "LobsterModelDownloader/1.0" };
  if (resumeFrom > 0) headers.Range = `bytes=${resumeFrom}-`;

  const res = await fetch(entry.url, { headers, signal: options.signal });
  if (!res.ok || !res.body) throw new Error(`descarga falló: HTTP ${res.status}`);
  const total = entry.sizeBytes ?? Number(res.headers.get("content-length") ?? 0) + resumeFrom;
  const append = resumeFrom > 0 && res.status === 206;

  const file = createWriteStream(partPath, { flags: append ? "a" : "w" });
  let received = append ? resumeFrom : 0;
  const reader = res.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await new Promise<void>((resolve, reject) =>
        file.write(Buffer.from(value), (error) => (error ? reject(error) : resolve()))
      );
      received += value.length;
      options.onProgress?.(received, total);
    }
  } finally {
    await new Promise<void>((resolve) => file.end(resolve));
  }

  const hash = await sha256File(partPath);
  if (hash !== entry.sha256) {
    await rm(partPath, { force: true });
    throw new Error(`hash inválido para ${entry.id}: esperado ${entry.sha256.slice(0, 12)}…, obtenido ${hash.slice(0, 12)}…`);
  }
  await rename(partPath, finalPath);
  return finalPath;
}
