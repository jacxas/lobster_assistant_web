import { describe, it, expect } from "vitest";
import db, { runMigrations } from "../db/client.js";
import { saveMessage, getHistory, countMessages, clearHistory } from "../db/messages.js";
import { upsertSession, getSession, deleteSession } from "../db/sessions.js";

// Los mensajes tienen FK a sessions: crear la sesión antes de guardar

describe("db", () => {
  it("las migraciones crean las tablas", () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain("sessions");
    expect(names).toContain("messages");
  });

  it("roundtrip de mensajes conserva rol y orden", () => {
    runMigrations();
    const sid = "test:roundtrip";
    upsertSession(sid, { platform: "test" });
    clearHistory(sid);
    saveMessage(sid, "user", "hola");
    saveMessage(sid, "assistant", "¡burbujas!");
    expect(getHistory(sid)).toEqual([
      { role: "user", content: "hola" },
      { role: "assistant", content: "¡burbujas!" },
    ]);
    expect(countMessages(sid)).toBe(2);
    clearHistory(sid);
    expect(countMessages(sid)).toBe(0);
  });

  it("getHistory respeta el límite", () => {
    const sid = "test:limit";
    upsertSession(sid, { platform: "test" });
    clearHistory(sid);
    for (let i = 0; i < 5; i++) {
      saveMessage(sid, "user", `mensaje ${i}`);
    }
    expect(getHistory(sid, 3)).toHaveLength(3);
    expect(getHistory(sid, 3)[2].content).toBe("mensaje 4");
    clearHistory(sid);
  });

  it("sesiones: upsert, get, update y delete", () => {
    const s = upsertSession("test:session-1", { platform: "discord", metadata: { user: "pepe" } });
    expect(s.platform).toBe("discord");
    expect(getSession("test:session-1")?.metadata).toEqual({ user: "pepe" });

    // Upsert de nuevo: refresca TTL, conserva user_id y actualiza metadata
    upsertSession("test:session-1", { metadata: { user: "pepe2" } });
    expect(getSession("test:session-1")?.metadata).toEqual({ user: "pepe2" });

    deleteSession("test:session-1");
    expect(getSession("test:session-1")).toBeNull();
  });
});
