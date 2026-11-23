import db from "./client.js";

const getStmt = db.prepare("SELECT value FROM settings WHERE key = ?");
const setStmt = db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()"
);
const delStmt = db.prepare("DELETE FROM settings WHERE key = ?");

/** Lee una preferencia guardada (o null si no existe). */
export function getSetting(key: string): string | null {
  const row = getStmt.get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

/** Guarda o reemplaza una preferencia. */
export function setSetting(key: string, value: string): void {
  setStmt.run(key, value);
}

/** Borra una preferencia. */
export function deleteSetting(key: string): void {
  delStmt.run(key);
}
