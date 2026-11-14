import { Router } from "express";
import db from "../db/client.js";
import { TOOLS, MAX_STEPS } from "../services/agent.js";

export const statsRouter: Router = Router();

interface CountRow {
  c: number;
}

interface RecentRow {
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: number;
}

/** GET /api/stats — métricas reales para el dashboard. */
statsRouter.get("/", (_req, res) => {
  const total = (db.prepare("SELECT COUNT(*) AS c FROM messages").get() as CountRow).c;
  const startOfToday = Math.floor(new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000);
  const today = (
    db.prepare("SELECT COUNT(*) AS c FROM messages WHERE created_at >= ?").get(startOfToday) as CountRow
  ).c;
  const sessions = (db.prepare("SELECT COUNT(*) AS c FROM sessions").get() as CountRow).c;

  const recentRows = db
    .prepare("SELECT session_id, role, content, created_at FROM messages ORDER BY created_at DESC, id DESC LIMIT 6")
    .all() as RecentRow[];

  const recent = recentRows.map((row) => ({
    role: row.role,
    content: String(row.content).replace(/\s+/g, " ").slice(0, 120),
    created_at: row.created_at,
    platform: String(row.session_id).includes(":") ? String(row.session_id).split(":")[0] : "web",
  }));

  res.json({
    messages: { total, today },
    sessions: { total: sessions },
    recent,
    agent: {
      allowClicks: process.env.AGENT_ALLOW_CLICKS === "1",
      visionModel: process.env.AGENT_VISION_MODEL || "nvidia/nemotron-3.5-super-vl:free",
      model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
      cloud: Boolean(process.env.OPENROUTER_API_KEY),
      maxSteps: MAX_STEPS,
      tools: Object.keys(TOOLS).length,
    },
  });
});
