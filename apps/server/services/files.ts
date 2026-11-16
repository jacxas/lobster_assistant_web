import os from "node:os";
import path from "node:path";
import { readdir, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";

const SKIP_DIRS = new Set(["node_modules", ".git", "AppData", ".cache", "$Recycle.Bin", "Windows"]);

/** Raíces permitidas para buscar (configurables con AGENT_SEARCH_ROOTS separados por ';'). */
export function allowedRoots(): string[] {
  const custom = process.env.AGENT_SEARCH_ROOTS;
  if (custom && custom.trim()) {
    return custom.split(";").map((item) => path.resolve(item.trim())).filter(Boolean);
  }
  const home = os.homedir();
  return [path.join(home, "Desktop"), path.join(home, "Documents"), path.join(home, "Downloads")].map((p) =>
    path.resolve(p)
  );
}

export function isInsideAllowedRoots(target: string): boolean {
  const resolved = path.resolve(target);
  return allowedRoots().some((root) => resolved === root || resolved.startsWith(root + path.sep));
}

export interface FoundFile {
  path: string;
  size: number;
  modified: string;
}

export interface SearchOptions {
  root?: string;
  maxResults?: number;
  maxDepth?: number;
}

/** Busca archivos por nombre (substring, sin distinguir mayúsculas) dentro de las raíces permitidas. */
export async function searchFiles(query: string, options: SearchOptions = {}): Promise<FoundFile[]> {
  const term = query.trim().toLowerCase();
  if (!term) throw new Error("la búsqueda está vacía");

  const roots = options.root ? [path.resolve(options.root)] : allowedRoots();
  for (const root of roots) {
    if (!isInsideAllowedRoots(root)) {
      throw new Error(`ruta no permitida: ${root} (solo ${allowedRoots().join(", ")})`);
    }
  }

  const maxResults = Math.min(Math.max(options.maxResults ?? 20, 1), 50);
  const maxDepth = Math.min(Math.max(options.maxDepth ?? 4, 1), 6);
  const found: FoundFile[] = [];

  const walk = async (dir: string, depth: number): Promise<void> => {
    if (found.length >= maxResults || depth > maxDepth) return;
    let entries: Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (found.length >= maxResults) return;
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(full, depth + 1);
      } else if (entry.name.toLowerCase().includes(term)) {
        try {
          const info = await stat(full);
          found.push({
            path: full,
            size: info.size,
            modified: info.mtime.toISOString().slice(0, 10),
          });
        } catch {
          /* archivo bloqueado: se ignora */
        }
      }
    }
  };

  for (const root of roots) {
    await walk(root, 0);
    if (found.length >= maxResults) break;
  }
  return found;
}
