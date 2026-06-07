import db from "./client.js";

export interface Message {
  id: number;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  created_at: number;
}

const insertStmt = db.prepare(
  "INSERT INTO messages (session_id, role, content, model) VALUES (?, ?, ?, ?)"
);

const getHistoryStmt = db.prepare(`
  SELECT role, content FROM messages
  WHERE session_id = ?
  ORDER BY created_at ASC
  LIMIT ?
`);

const countStmt = db.prepare(
  "SELECT COUNT(*) as count FROM messages WHERE session_id = ?"
);

const clearStmt = db.prepare("DELETE FROM messages WHERE session_id = ?");

export function saveMessage(
  session_id: string,
  role: Message["role"],
  content: string,
  model?: string
) {
  insertStmt.run(session_id, role, content, model ?? null);
}

/** Returns the last N message pairs as ChatMessage array for Ollama context */
export function getHistory(
  session_id: string,
  limit = 20
): Array<{ role: string; content: string }> {
  return getHistoryStmt.all(session_id, limit) as any[];
}

export function countMessages(session_id: string): number {
  const row = countStmt.get(session_id) as { count: number };
  return row.count;
}

export function clearHistory(session_id: string) {
  clearStmt.run(session_id);
}
