import { createServer, type IncomingMessage, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clearBrain, cloudChat, getBrain, setBrain } from "../services/llm.js";

let server: Server;
let baseUrl = "";
let lastPayload: Record<string, unknown> | null = null;

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk.toString()));
    req.on("end", () => resolve(data));
  });

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const raw = await readBody(req);
    try {
      lastPayload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      lastPayload = null;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: '{"final":"ok"}' } }] }));
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

describe("cerebro conmutable", () => {
  it("por defecto está en modo nube", () => {
    clearBrain();
    expect(getBrain().mode).toBe("cloud");
  });

  it("setBrain cambia baseUrl/modelo y clearBrain vuelve atrás", () => {
    setBrain({ mode: "local", baseUrl, apiKey: "local", model: "eco", visionModel: "" });
    expect(getBrain().mode).toBe("local");
    expect(getBrain().baseUrl).toBe(baseUrl);
    expect(getBrain().visionModel).toBe("");
    clearBrain();
    expect(getBrain().mode).toBe("cloud");
  });

  it("jsonMode agrega response_format json_object al payload", async () => {
    setBrain({ mode: "local", baseUrl, apiKey: "local", model: "eco", visionModel: "" });
    const reply = await cloudChat([{ role: "user", content: "hola" }], { jsonMode: true });
    expect(reply).toBe('{"final":"ok"}');
    expect(lastPayload?.response_format).toEqual({ type: "json_object" });
    expect(lastPayload?.model).toBe("eco");
    clearBrain();
  });

  it("sin jsonMode no manda response_format", async () => {
    setBrain({ mode: "local", baseUrl, apiKey: "local", model: "eco", visionModel: "" });
    await cloudChat([{ role: "user", content: "hola" }]);
    expect(lastPayload?.response_format).toBeUndefined();
    clearBrain();
  });
});
