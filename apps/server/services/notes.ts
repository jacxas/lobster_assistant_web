import db from "../db/client.js";

export interface Note {
  id: number;
  content: string;
  created_at: number;
}

const insertStmt = () => db.prepare("INSERT INTO notes (content) VALUES (?)");
const getStmt = () => db.prepare("SELECT id, content, created_at FROM notes WHERE id = ?");
const listStmt = () =>
  db.prepare("SELECT id, content, created_at FROM notes ORDER BY created_at DESC, id DESC LIMIT ?");
const deleteStmt = () => db.prepare("DELETE FROM notes WHERE id = ?");

export function saveNote(content: string): Note {
  const clean = content.trim();
  if (!clean) throw new Error("la nota está vacía");
  const info = insertStmt().run(clean.slice(0, 2000));
  return getStmt().get(info.lastInsertRowid) as Note;
}

export function listNotes(limit = 20): Note[] {
  return listStmt().all(Math.min(Math.max(limit, 1), 100)) as Note[];
}

export function deleteNote(id: number): boolean {
  return deleteStmt().run(id).changes > 0;
}
