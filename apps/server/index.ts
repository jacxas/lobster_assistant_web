import express, { type Express, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/api/status", (req: Request, res: Response) => {
  res.json({
    status: "online",
    runtime: "lobster-assistant",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Placeholder chat endpoint (connect to Ollama when needed)
app.post("/api/chat", (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  // Placeholder response - replace with actual Ollama integration
  res.json({
    response: "🦞 Hello! I'm the Lobster Assistant. This is a placeholder response. Connect me to your Ollama runtime for real AI conversations.",
    timestamp: new Date().toISOString(),
  });
});

// Serve static files from public directory (web app build)
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // SPA fallback: serve index.html for all non-API routes
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🦞 Lobster Assistant server running on http://localhost:${PORT}`);
  if (fs.existsSync(publicDir)) {
    console.log(`📱 Web app served from ${publicDir}`);
  }
});
