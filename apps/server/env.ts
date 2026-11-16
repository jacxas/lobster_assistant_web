// Carga el .env de la raíz del repo ANTES de que otros módulos lean process.env.
// Debe ser el primer import de index.ts (el orden de evaluación ESM respeta el orden de imports).
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// apps/server/env.ts -> ../../.env (raíz del monorepo)
config({ path: path.resolve(here, "../../.env") });
