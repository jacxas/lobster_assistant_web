import { Router, Request, Response } from "express";
import { sessionMiddleware } from "../middleware/session.js";
import { upsertSession, deleteSession } from "../db/sessions.js";

const COOKIE_NAME = "app_session_id";

export const oauthRouter = Router();
oauthRouter.use(sessionMiddleware);

/** GET /api/oauth/callback — receives OAuth code from portal */
oauthRouter.get("/callback", async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code) {
    res.status(400).json({ error: "Missing OAuth code" });
    return;
  }

  try {
    const oauthPortalUrl = process.env.VITE_OAUTH_PORTAL_URL || process.env.OAUTH_PORTAL_URL;
    const appId = process.env.VITE_APP_ID || process.env.APP_ID;
    const appSecret = process.env.APP_SECRET;

    if (!oauthPortalUrl || !appId || !appSecret) {
      // OAuth not configured — anonymous session already exists via middleware
      res.redirect("/");
      return;
    }

    // Exchange code for user info with the OAuth portal
    const tokenRes = await fetch(`${oauthPortalUrl}/api/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, appId, appSecret }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const { userId } = await tokenRes.json() as { userId: string; email?: string; name?: string };

    // Attach userId to the existing session
    upsertSession(req.sessionId, { user_id: userId, platform: "web" });

    let redirectTo = "/";
    try { redirectTo = atob(String(state)); } catch { /* use default */ }

    res.redirect(redirectTo);
  } catch (err) {
    console.error("[oauth] callback error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

/** GET /api/oauth/me — returns current session */
oauthRouter.get("/me", (req: Request, res: Response) => {
  const { getSession } = require("../db/sessions.js");
  const session = getSession(req.sessionId);
  if (!session?.user_id) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ userId: session.user_id, platform: session.platform });
});

/** POST /api/oauth/logout — destroys session */
oauthRouter.post("/logout", (req: Request, res: Response) => {
  deleteSession(req.sessionId);
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});
