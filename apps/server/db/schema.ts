// Migrations live in client.ts: they must run before any top-level
// db.prepare() in sessions/messages. Re-exported to keep import paths stable.
export { runMigrations } from "./client.js";
