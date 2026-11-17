import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { downloadModel, parseManifest, sha256File } from "../services/models.js";

const BODY = Buffer.from("GGUF-fake-model-bytes-".repeat(200));
const HASH = createHash("sha256").update(BODY).digest("hex");

let server: Server;
let baseUrl = "";
let tempDir = "";

beforeAll(async () => {
  server = createServer((req, res) => {
    const range = req.headers.range;
    if (range) {
      const start = Number(/bytes=(\d+)-/.exec(range)?.[1] ?? 0);
      const slice = BODY.subarray(start);
      res.writeHead(206, {
        "Content-Type": "application/octet-stream",
        "Content-Length": slice.length,
        "Content-Range": `bytes ${start}-${BODY.length - 1}/${BODY.length}`,
      });
      res.end(slice);
      return;
    }
    res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": BODY.length });
    res.end(BODY);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}/model.gguf`;
  tempDir = await mkdtemp(path.join(os.tmpdir(), "lobster-models-"));
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(tempDir, { recursive: true, force: true });
});

describe("parseManifest", () => {
  it("acepta un manifest válido", () => {
    const manifest = parseManifest(
      JSON.stringify({
        version: "1.0",
        models: { eco: { name: "Eco 1B", url: baseUrl, sha256: HASH, sizeBytes: BODY.length } },
      })
    );
    expect(manifest.models.eco.sha256).toBe(HASH);
    expect(manifest.models.eco.name).toBe("Eco 1B");
  });

  it("rechaza JSON roto, sha inválido y urls no http", () => {
    expect(() => parseManifest("no json")).toThrow(/no es JSON/);
    expect(() =>
      parseManifest(JSON.stringify({ version: "1", models: { x: { url: baseUrl, sha256: "abc" } } }))
    ).toThrow(/sha256 inválido/);
    expect(() =>
      parseManifest(JSON.stringify({ version: "1", models: { x: { url: "file:///x.gguf", sha256: HASH } } }))
    ).toThrow(/http/);
    expect(() => parseManifest(JSON.stringify({ version: "1", models: {} }))).toThrow(/sin modelos/);
  });
});

describe("downloadModel", () => {
  const entry = () => ({ id: "eco", name: "Eco", url: baseUrl, sha256: HASH, sizeBytes: BODY.length });

  it("descarga, verifica sha256 y deja el archivo final", async () => {
    const progress: number[] = [];
    const file = await downloadModel(entry(), tempDir, { onProgress: (received) => progress.push(received) });
    expect(await readFile(file)).toEqual(BODY);
    expect(await sha256File(file)).toBe(HASH);
    expect(progress.at(-1)).toBe(BODY.length);
  });

  it("no vuelve a descargar si el archivo ya es válido", async () => {
    const file = await downloadModel(entry(), tempDir);
    const before = (await readFile(file)).length;
    const again = await downloadModel(entry(), tempDir);
    expect(again).toBe(file);
    expect((await readFile(again)).length).toBe(before);
  });

  it("reanuda desde un .part incompleto (Range)", async () => {
    const dir = await mkdtemp(path.join(tempDir, "resume-"));
    const partial = BODY.subarray(0, 1000);
    await writeFile(path.join(dir, "eco.gguf.part"), partial);
    const file = await downloadModel(entry(), dir);
    expect(await readFile(file)).toEqual(BODY);
  });

  it("rechaza y limpia si el hash no coincide", async () => {
    const dir = await mkdtemp(path.join(tempDir, "badhash-"));
    await expect(downloadModel({ ...entry(), sha256: "0".repeat(64) }, dir)).rejects.toThrow(/hash inválido/);
    await expect(readFile(path.join(dir, "eco.gguf.part"))).rejects.toThrow();
  });
});
