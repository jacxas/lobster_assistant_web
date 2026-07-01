import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) return;
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > TRIM_TARGET_BYTES) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch { /* ignore */ }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((e) => `[${new Date().toISOString()}] ${JSON.stringify(e)}`);
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") return html;
      return { html, tags: [{ tag: "script", attrs: { src: "/__manus__/debug-collector.js", defer: true }, injectTo: "head" }] };
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") return next();
        const handlePayload = (payload: any) => {
          if (payload.consoleLogs?.length > 0) writeToLogFile("browserConsole", payload.consoleLogs);
          if (payload.networkRequests?.length > 0) writeToLogFile("networkRequests", payload.networkRequests);
          if (payload.sessionEvents?.length > 0) writeToLogFile("sessionReplay", payload.sessionEvents);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") { handlePayload(reqBody); return; }
        let body = "";
        req.on("data", (c) => { body += c.toString(); });
        req.on("end", () => { try { handlePayload(JSON.parse(body)); } catch (e) { res.writeHead(400); res.end(); } });
      });
    },
  };
}

function vitePluginStorageProxy(): Plugin {
  return {
    name: "manus-storage-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/manus-storage", async (req, res) => {
        const key = req.url?.replace(/^\//, "");
        if (!key) { res.writeHead(400); res.end("Missing key"); return; }
        const forgeBase = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
        if (!forgeBase || !forgeKey) { res.writeHead(500); res.end("Not configured"); return; }
        try {
          const url = new URL("v1/storage/presign/get", forgeBase + "/");
          url.searchParams.set("path", key);
          const resp = await fetch(url, { headers: { Authorization: `Bearer ${forgeKey}` } });
          if (!resp.ok) { res.writeHead(502); res.end("Backend error"); return; }
          const { url: signedUrl } = await resp.json() as { url: string };
          if (!signedUrl) { res.writeHead(502); res.end("Empty URL"); return; }
          res.writeHead(307, { Location: signedUrl, "Cache-Control": "no-store" }); res.end();
        } catch { res.writeHead(502); res.end("Proxy error"); }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector(), vitePluginStorageProxy()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@lobster/shared": path.resolve(import.meta.dirname, "..", "..", "packages", "shared", "src"),
    },
  },
  root: import.meta.dirname,
  build: { outDir: path.resolve(import.meta.dirname, "dist"), emptyOutDir: true },
  server: { port: 5173, strictPort: false, host: true },
});
