import { describe, expect, it } from "vitest";
import { parseBrainPref } from "../services/brainState.js";

describe("parseBrainPref", () => {
  it("acepta modo nube", () => {
    expect(parseBrainPref('{"mode":"cloud"}')).toEqual({ mode: "cloud" });
  });

  it("acepta un modelo local del catálogo", () => {
    expect(parseBrainPref('{"mode":"local","modelId":"ligero-llama32-1b"}')).toEqual({
      mode: "local",
      modelId: "ligero-llama32-1b",
    });
  });

  it("rechaza un modelo que no está en el catálogo", () => {
    expect(parseBrainPref('{"mode":"local","modelId":"inventado"}')).toBeNull();
  });

  it("rechaza JSON corrupto o vacío", () => {
    expect(parseBrainPref("no es json")).toBeNull();
    expect(parseBrainPref("")).toBeNull();
    expect(parseBrainPref(null)).toBeNull();
  });

  it("rechaza un modo desconocido", () => {
    expect(parseBrainPref('{"mode":"magia"}')).toBeNull();
  });
});
