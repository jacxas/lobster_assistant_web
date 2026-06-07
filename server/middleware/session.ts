import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { upsertSession, getSession } from "../db/sessions.js";

const COOKIE_NAME = "app_session_id";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

export function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  let sessionId = req.cookies?.[COOKIE_NAME] as string | undefined;

  // Validate existing session is still alive in DB
  if (sessionId && !getSession(sessionId)) {
    sessionId = undefined;
  }

  // Create new session if needed
  if (!sessionId) {
    sessionId = nanoid();
  }

  // Upsert refreshes last_seen + extends TTL
  upsertSession(sessionId, { platform: "web" });

  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });

  req.sessionId = sessionId;
  next();
}
