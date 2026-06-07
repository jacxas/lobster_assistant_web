import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  const store = new Map<string, RateLimitEntry>();

  // Clean up expired entries every windowMs
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, options.windowMs);

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    // Allow internal bot requests via secret header
    const internalKey = req.headers["x-internal-key"];
    if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
      return next();
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    entry.count++;

    if (entry.count > options.max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", options.max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", new Date(entry.resetAt).toISOString());
      res.status(429).json({
        error: "Too many requests",
        message: options.message,
        retryAfter: retryAfterSec,
      });
      return;
    }

    res.setHeader("X-RateLimit-Limit", options.max);
    res.setHeader("X-RateLimit-Remaining", options.max - entry.count);
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetAt).toISOString());
    next();
  };
}

/** General API limit: 100 requests per 15 minutes */
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please wait 15 minutes before trying again.",
});

/** Chat limit: 20 requests per minute (protects Ollama) */
export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Chat limit reached. Maximum 20 messages per minute.",
});
