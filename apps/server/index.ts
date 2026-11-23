import "./env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { runMigrations } from "./db/schema.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { chatRouter } from "./routes/chat.js";
import { agentRouter } from "./routes/agent.js";
import { statsRouter } from "./routes/stats.js";
import { modelsRouter } from "./routes/models.js";
import { engineRouter } from "./routes/engine.js";
import { brainRouter } from "./routes/brain.js";
import { oauthRouter } from "./routes/oauth.js";
import { statusRouter } from "./routes/status.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configura la app Express (migraciones incluidas).
 * Exportada para poder testear sin abrir puerto.
 */
export function buildApp(): Express {
  // Run DB migrations before accepting requests (idempotente)
  runMigrations();

  const app = express();

  // CORS: en desarrollo el panel puede abrirse como localhost o 127.0.0.1
  // (y a veces con la IP de la LAN); cualquier otro origen se rechaza.
  const clientOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

  app.use(
    cors({
      origin(origin, callback) {
        // Sin cabecera Origin (curl, mismo origen) se permite.
        if (!origin) return callback(null, true);
        if (localOrigin.test(origin) || clientOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origen no permitido: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", generalLimiter);
  app.use("/api/oauth", oauthRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/agent", agentRouter);
  app.use("/api/status", statusRouter);
  app.use("/api/stats", statsRouter);
  app.use("/api/models", modelsRouter);
  app.use("/api/engine", engineRouter);
  app.use("/api/brain", brainRouter);

  // Zona de pruebas para vision/clic (estatica, no toca el sistema)
  app.get("/sandbox", (_req, res) => {
    res.type("html").sendFile(path.resolve(__dirname, "sandbox.html"));
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Error handling — Express exige 4 parámetros para reconocer un
  // middleware de errores; con 3 lo trata como ruta normal y rompe.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

async function startServer() {
  const app = buildApp();
  const server = createServer(app);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🦞 Lobster server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
