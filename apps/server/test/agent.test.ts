import { describe, expect, it, vi } from "vitest";
import { extractJsonObject, parseStep, runAgent, type AgentBrain } from "../services/agent.js";

const brainFrom = (replies: string[]): AgentBrain => {
  let index = 0;
  return vi.fn(async () => {
    const reply = replies[Math.min(index, replies.length - 1)];
    index++;
    return reply;
  });
};

describe("parseStep / extractJsonObject", () => {
  it("extrae JSON envuelto en ruido o markdown", () => {
    expect(parseStep('```json\n{"action":"sys_info","args":{}}\n```')).toEqual({
      kind: "action",
      action: "sys_info",
      args: {},
    });
    expect(parseStep('texto previo {"final":"listo"} texto posterior')).toEqual({ kind: "final", text: "listo" });
  });

  it("devuelve null con JSON roto o sin JSON", () => {
    expect(parseStep("no hay json aqui")).toBeNull();
    expect(parseStep('{"action":"list_files"')).toBeNull();
    expect(parseStep('{"otra":"cosa"}')).toBeNull();
  });

  it("tolera braces anidados y args faltantes", () => {
    expect(parseStep('{"action":"run_command","args":{"command":"dir C:\\\\x"}}')).toEqual({
      kind: "action",
      action: "run_command",
      args: { command: "dir C:\\x" },
    });
    expect(parseStep('{"action":"sys_info"}')).toEqual({ kind: "action", action: "sys_info", args: {} });
  });

  it("extractJsonObject devuelve el primer objeto equilibrado", () => {
    expect(extractJsonObject('x {"a":{"b":1}} y')).toBe('{"a":{"b":1}}');
    expect(extractJsonObject("sin llaves {")).toBeNull();
  });
});

describe("runAgent", () => {
  it("ejecuta una herramienta y devuelve el final", async () => {
    const events: string[] = [];
    const answer = await runAgent("prueba", {
      maxSteps: 4,
      brain: brainFrom([
        '{"action":"sys_info","args":{}}',
        '{"final":"El sistema esta listo"}',
      ]),
      onEvent: (event) => events.push(event.type),
    });
    expect(answer).toBe("El sistema esta listo");
    expect(events).toEqual(["action", "observation", "final"]);
  });

  it("bloquea comandos fuera del allowlist y continua", async () => {
    const answer = await runAgent("prueba", {
      maxSteps: 5,
      brain: brainFrom([
        '{"action":"run_command","args":{"command":"del /f C:\\\\x"}}',
        '{"final":"el comando fue bloqueado"}',
      ]),
      onEvent: (event) => {
        if (event.type === "observation") expect(event.result).toContain("no permitido");
      },
    });
    expect(answer).toContain("bloqueado");
  });

  it("rechaza comandos con metacaracteres de shell", async () => {
    await runAgent("prueba", {
      maxSteps: 4,
      brain: brainFrom([
        '{"action":"run_command","args":{"command":"dir & echo hackeado"}}',
        '{"final":"ok"}',
      ]),
      onEvent: (event) => {
        if (event.type === "observation") expect(event.result).toContain("allowlist");
      },
    });
  });

  it("rechaza URLs no http/https", async () => {
    await runAgent("prueba", {
      maxSteps: 4,
      brain: brainFrom([
        '{"action":"open_url","args":{"url":"file:///C:/Windows"}}',
        '{"final":"url rechazada"}',
      ]),
      onEvent: (event) => {
        if (event.type === "observation") expect(event.result).toContain("http/https");
      },
    });
  });

  it("se recupera de una respuesta con formato invalido", async () => {
    const answer = await runAgent("prueba", {
      maxSteps: 4,
      brain: brainFrom([
        "creo que la respuesta es hola",
        '{"final":"recuperado"}',
      ]),
    });
    expect(answer).toBe("recuperado");
  });

  it("falla cuando agota los pasos", async () => {
    await expect(
      runAgent("prueba", {
        maxSteps: 2,
        brain: brainFrom(['{"action":"sys_info","args":{}}']),
      })
    ).rejects.toThrow(/no termin/i);
  });

  it("propaga la cancelacion", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      runAgent("prueba", {
        maxSteps: 3,
        signal: controller.signal,
        brain: brainFrom(['{"action":"sys_info","args":{}}']),
      })
    ).rejects.toThrow(/cancelado/i);
  });
});
