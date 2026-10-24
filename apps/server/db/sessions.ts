import db from "./client.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Session {
  id: string;
  user_id: string | null;
  platform: string;
  created_at: number;
  last_seen: number;
  expires_at: number;
  metadata: Record<string, unknown> | null;
}

const getStmt = db.prepare(
  "SELECT * FROM sessions WHERE id = ? AND expires_at > unixepoch()"
);

const upsertStmt = db.prepare(`
  INSERT INTO sessions (id, user_id, platform, expires_at, metadata)
    VALUES (@id, @user_id, @platform, @expires_at, @metadata)
  ON CONFLICT(id) DO UPDATE SET
    last_seen  = unixepoch(),
    expires_at = @expires_at,
    user_id    = COALESCE(@user_id, user_id),
    metadata   = COALESCE(@metadata, metadata)
`);

const deleteStmt = db.prepare("DELETE FROM sessions WHERE id = ?");

const purgeStmt = db.prepare("DELETE FROM sessions WHERE expires_at <= unixepoch()");

export function getSession(id: string): Session | null {
  const row = getStmt.get(id) as any;
  if (!row) return null;
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

export function upsertSession(
  id: string,
  opts: { user_id?: string; platform?: string; metadata?: Record<string, unknown> } = {}
): Session {
  const expires_at = Math.floor((Date.now() + SESSION_TTL_MS) / 1000);
  upsertStmt.run({
    id,
    user_id: opts.user_id ?? null,
    platform: opts.platform ?? "web",
    expires_at,
    metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
  });
  return getSession(id)!;
}

export function deleteSession(id: string) {
  deleteStmt.run(id);
}

/** Should be called periodically to clean up expired sessions */
export function purgeExpiredSessions() {
  const result = purgeStmt.run();
  if (result.changes > 0) {
    console.log(`[db] Purged ${result.changes} expired session(s)`);
  }
}

// Auto-purge every hour
setInterval(purgeExpiredSessions, 60 * 60 * 1000);
