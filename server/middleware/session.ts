import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";

export interface SessionData {
  userId?: string;
  platform?: string;
  createdAt?: number;
}

// In-memory session store (replace with Redis/DB for production)
const sessions = new Map<string, SessionData>();

export function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  let sessionId = req.cookies?.[COOKIE_NAME];

  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = nanoid();
    sessions.set(sessionId, { createdAt: Date.now() });
    res.cookie(COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ONE_YEAR_MS,
    });
  }

  (req as any).sessionId = sessionId;
  (req as any).session = sessions.get(sessionId)!;
  next();
}

export function getSession(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId);
}

export function setSession(sessionId: string, data: Partial<SessionData>) {
  const existing = sessions.get(sessionId) || {};
  sessions.set(sessionId, { ...existing, ...data });
}

export function destroySession(sessionId: string) {
  sessions.delete(sessionId);
}
