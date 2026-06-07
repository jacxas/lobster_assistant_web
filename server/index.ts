import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { chatRouter } from "./routes/chat.js";
import { oauthRouter } from "./routes/oauth.js";
import { statusRouter } from "./routes/status.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // API routes
  app.use("/api/oauth", oauthRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/status", statusRouter);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🦞 Lobster server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
