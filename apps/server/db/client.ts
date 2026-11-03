import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production use /app/data (Docker volume), in dev use local .data/
const dataDir =
  process.env.NODE_ENV === "production"
    ? "/app/data"
    : path.resolve(__dirname, "../../.data");

fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "lobster.db");

const db = new Database(dbPath);

// Performance: WAL mode for concurrent reads + writes
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");

const MIGRATIONS_SQL = `
  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT,
    platform    TEXT NOT NULL DEFAULT 'web',
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    last_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at  INTEGER NOT NULL,
    metadata    TEXT  -- JSON blob for extra data (OAuth profile, etc.)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    model       TEXT,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);
`;

/**
 * Migrations run automatically when this module is imported, so every
 * consumer (routes, sessions, messages) always sees a ready schema.
 * Idempotent: safe to call more than once.
 */
export function runMigrations() {
  db.exec(MIGRATIONS_SQL);
}

// Run once at import time — before any top-level db.prepare() in sibling modules.
runMigrations();

console.log(`[db] SQLite ready at ${dbPath}`);

export default db;
