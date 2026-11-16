import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { allowedRoots, isInsideAllowedRoots, searchFiles } from "../services/files.js";
import { resolveApp } from "../services/apps.js";

let tempRoot = "";

beforeAll(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "lobster-search-"));
  await writeFile(path.join(tempRoot, "presupuesto-2026.pdf"), "x");
  await writeFile(path.join(tempRoot, "notas.txt"), "hola");
  process.env.AGENT_SEARCH_ROOTS = tempRoot;
});

afterAll(async () => {
  delete process.env.AGENT_SEARCH_ROOTS;
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
});

describe("files", () => {
  it("usa la raíz configurada por env", () => {
    expect(allowedRoots()).toEqual([path.resolve(tempRoot)]);
    expect(isInsideAllowedRoots(path.join(tempRoot, "notas.txt"))).toBe(true);
    expect(isInsideAllowedRoots("C:\\Windows\\win.ini")).toBe(false);
  });

  it("encuentra archivos por nombre sin distinguir mayúsculas", async () => {
    const found = await searchFiles("PRESUPUESTO");
    expect(found).toHaveLength(1);
    expect(found[0].path).toContain("presupuesto-2026.pdf");
    expect(found[0].size).toBeGreaterThan(0);
  });

  it("rechaza buscar fuera de las raíces permitidas", async () => {
    await expect(searchFiles("win.ini", { root: "C:\\Windows" })).rejects.toThrow(/no permitida/);
  });
});

describe("apps", () => {
  it("resuelve alias permitidos", () => {
    expect(resolveApp("notepad")).toBe("notepad.exe");
    expect(resolveApp("calculadora")).toBe("calc.exe");
    expect(resolveApp("chrome")).toMatch(/chrome\.exe$/);
  });

  it("entiende rutas completas y mayúsculas", () => {
    expect(resolveApp("C:\\Windows\\System32\\notepad.exe")).toBe("notepad.exe");
    expect(resolveApp("CALC.EXE")).toBe("calc.exe");
    expect(resolveApp("bloc de notas")).toBe("notepad.exe");
  });

  it("rechaza apps fuera de la allowlist", () => {
    expect(() => resolveApp("cmd")).toThrow(/no permitida/);
    expect(() => resolveApp("powershell")).toThrow(/no permitida/);
  });
});
