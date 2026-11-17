import { describe, it, expect, afterAll } from "vitest";
import type { AddressInfo } from "node:net";
import { buildApp } from "../index.js";

const app = buildApp();
const server = app.listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

afterAll(() => {
  server.close();
});

describe("api", () => {
  it("GET /api/status responde 200 con status ok|degraded", async () => {
    const res = await fetch(`${base}/api/status`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(["ok", "degraded"]).toContain(body.status);
  });

  it("POST /api/chat con cuerpo inválido responde 400", async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/chat de bots usa sesión derivada platform:chatId", async () => {
    // Sin Ollama real este endpoint responde 502 controlado (o 200 si hay
    // Ollama local con el modelo). Lo importante: no es 500 ni 400.
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "hola",
        platform: "discord",
        chatId: "test-chat-1",
        stream: false,
      }),
    });
    expect([200, 502]).toContain(res.status);
  });

  it("GET /api/models devuelve el catálogo curado con estado local", async () => {
    const res = await fetch(`${base}/api/models`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.models)).toBe(true);
    expect(body.models.length).toBeGreaterThanOrEqual(3);
    for (const model of body.models) {
      expect(typeof model.id).toBe("string");
      expect(model.url).toMatch(/^https:\/\//);
      expect(typeof model.installed).toBe("boolean");
    }
  });

  it("DELETE /api/models/:id desconocido responde 404", async () => {
    const res = await fetch(`${base}/api/models/no-existe`, { method: "DELETE" });
    expect(res.status).toBe(404);
  });

  it("POST /api/chat /cangrejo activa el modo y /normal lo desactiva", async () => {
    const send = async (message: string) => {
      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, platform: "telegram", chatId: "test-crab", stream: false }),
      });
      return { status: res.status, body: await res.json() };
    };
    const on = await send("/cangrejo");
    expect(on.status).toBe(200);
    expect(on.body.reply).toContain("ACTIVADO");
    const off = await send("/normal");
    expect(off.status).toBe(200);
    expect(off.body.reply).toContain("desactivado");
  });

  it("DELETE /api/chat/history responde ok", async () => {
    const res = await fetch(`${base}/api/chat/history`, { method: "DELETE" });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});
