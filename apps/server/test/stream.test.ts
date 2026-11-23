import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clearBrain, setBrain } from "../services/llm.js";
import { streamChat } from "../services/ollama.js";

let server: Server;
let baseUrl = "";
let modo: "sse" | "error" = "sse";

const trozos = ["Ho", "la", ", qué", " tal"];

beforeAll(async () => {
  server = createServer((req, res) => {
    if (modo === "error") {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "boom" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
    for (const t of trozos) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}/v1`;
});

afterAll(async () => {
  clearBrain();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const correr = () =>
  new Promise<{ texto: string; hecho: boolean; error: string | null }>((resolve) => {
    let texto = "";
    let hecho = false;
    let error: string | null = null;
    void streamChat(
      [{ role: "user", content: "hola" }],
      "",
      (t) => {
        texto += t;
      },
      () => {
        hecho = true;
        resolve({ texto, hecho, error });
      },
      (e) => {
        error = e.message;
        resolve({ texto, hecho, error });
      }
    );
  });

describe("streamChat contra el cerebro activo", () => {
  it("arma el texto con los deltas SSE del proveedor", async () => {
    modo = "sse";
    setBrain({ mode: "local", baseUrl, apiKey: "local", model: "eco", visionModel: "" });
    const r = await correr();
    expect(r.texto).toBe(trozos.join(""));
    expect(r.hecho).toBe(true);
    expect(r.error).toBeNull();
  });

  it("reporta error si el proveedor responde 500 (sin streaming ni fallback)", async () => {
    modo = "error";
    setBrain({ mode: "local", baseUrl, apiKey: "local", model: "eco", visionModel: "" });
    const r = await correr();
    expect(r.error).toBeTruthy();
    expect(r.texto).toBe("");
  });
});
