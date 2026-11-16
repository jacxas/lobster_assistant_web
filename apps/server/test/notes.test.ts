import { afterAll, describe, expect, it } from "vitest";
import { deleteNote, listNotes, saveNote } from "../services/notes.js";

const created: number[] = [];
const track = (id: number) => {
  created.push(id);
  return id;
};

afterAll(() => {
  for (const id of created) deleteNote(id);
});

describe("notes", () => {
  it("guarda una nota y devuelve id + contenido", () => {
    const note = saveNote("comprar café");
    track(note.id);
    expect(note.id).toBeGreaterThan(0);
    expect(note.content).toBe("comprar café");
    expect(note.created_at).toBeGreaterThan(0);
  });

  it("lista las notas más recientes primero", () => {
    const first = saveNote("primera prueba");
    const second = saveNote("segunda prueba");
    track(first.id);
    track(second.id);
    const list = listNotes(50);
    const ids = list.map((n) => n.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
  });

  it("rechaza notas vacías", () => {
    expect(() => saveNote("   ")).toThrow(/vacía/);
  });

  it("borra por id", () => {
    const note = saveNote("para borrar");
    expect(deleteNote(note.id)).toBe(true);
    expect(deleteNote(note.id)).toBe(false);
  });
});
