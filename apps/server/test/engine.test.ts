import os from "node:os";
import { mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildEngineArgs, LocalEngine } from "../services/engine.js";

describe("buildEngineArgs", () => {
  it("arma los flags de llama-server (silencioso, sin webui, tools)", () => {
    const args = buildEngineArgs({ modelPath: "C:/models/eco.gguf", port: 8080 });
    expect(args).toContain("--model");
    expect(args).toContain("C:/models/eco.gguf");
    expect(args.join(" ")).toContain("--host 127.0.0.1");
    expect(args.join(" ")).toContain("--port 8080");
    expect(args).toContain("--jinja");
    expect(args).toContain("--no-webui");
    expect(args).toContain("--log-disable");
    const threads = Number(args[args.indexOf("--threads") + 1]);
    expect(threads).toBe(Math.max(1, Math.floor(os.cpus().length / 2)));
  });

  it("agrega --lora cuando hay adaptador", () => {
    const args = buildEngineArgs({ modelPath: "m.gguf", loraPath: "codigo.gguf" });
    expect(args.join(" ")).toContain("--lora codigo.gguf");
  });
});

describe("LocalEngine", () => {
  it("reporta estado detenido por defecto", () => {
    const engine = new LocalEngine({ port: 8081 });
    const status = engine.status();
    expect(status.running).toBe(false);
    expect(status.url).toBeNull();
    expect(status.port).toBe(8081);
  });

  it("falla con mensaje claro si falta el binario", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "lobster-engine-"));
    const model = path.join(dir, "m.gguf");
    await writeFile(model, "x");
    const engine = new LocalEngine({ port: 8082 });
    await expect(engine.start(model, { binaryPath: path.join(dir, "no-existe.exe") })).rejects.toThrow(/falta el motor/);
  });

  it("falla con mensaje claro si falta el modelo", async () => {
    const engine = new LocalEngine({ port: 8083 });
    await expect(
      engine.start(path.join(os.tmpdir(), "no-existe.gguf"), { binaryPath: process.execPath })
    ).rejects.toThrow(/falta el modelo/);
  });
});
