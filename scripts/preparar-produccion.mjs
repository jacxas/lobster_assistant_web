// Prepara el modo producción: copia el build del panel web a apps/server/public
// para que el API lo sirva desde el mismo puerto (sin Vite ni watcher).
import { cp, rm, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDist = path.join(root, "apps", "web", "dist");
const target = path.join(root, "apps", "server", "dist", "public");

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

if (!(await exists(webDist))) {
  console.error(`[prod] falta el build del panel: ${webDist}\n       corré antes: pnpm --filter @lobster/web build`);
  process.exit(1);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(webDist, target, { recursive: true });
console.log(`[prod] panel copiado a ${target}`);
