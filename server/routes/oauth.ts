import { Router, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { sessionMiddleware, setSession, destroySession } from "../middleware/session.js";

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
      // OAuth not configured — create anonymous session and redirect
      const sessionId = (req as any).sessionId;
      setSession(sessionId, { userId: `anon_${sessionId}`, platform: "web" });
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
    const { userId, email, name } = await tokenRes.json() as { userId: string; email?: string; name?: string };

    const sessionId = (req as any).sessionId;
    setSession(sessionId, { userId, platform: "web" });

    // Decode redirect destination from state
    let redirectTo = "/";
    try { redirectTo = atob(String(state)); } catch { /* use default */ }

    res.redirect(redirectTo);
  } catch (err) {
    console.error("[oauth] callback error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

/** GET /api/oauth/me — returns current session user */
oauthRouter.get("/me", (req: Request, res: Response) => {
  const session = (req as any).session;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ userId: session.userId, platform: session.platform });
});

/** POST /api/oauth/logout — destroys session */
oauthRouter.post("/logout", (req: Request, res: Response) => {
  const sessionId = (req as any).sessionId;
  destroySession(sessionId);
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});
