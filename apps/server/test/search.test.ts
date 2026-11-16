import { describe, expect, it } from "vitest";
import { parseDdgResults, resolveDdgUrl } from "../services/search.js";

const FIXTURE = `
<div class="result results_links results_links_deep web-result">
  <div class="links_main links_deep result__body">
    <h2 class="result__title">
      <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fes.wikipedia.org%2Fwiki%2FTypeScript&amp;rut=abc">TypeScript <b>Wikipedia</b></a>
    </h2>
    <a class="result__snippet" href="//duckduckgo.com/l/?uddg=x">TypeScript es un lenguaje de programación <b>tipado</b> desarrollado por Microsoft.</a>
  </div>
</div>
<div class="result results_links results_links_deep web-result">
  <div class="links_main links_deep result__body">
    <h2 class="result__title">
      <a rel="nofollow" class="result__a" href="https://www.typescriptlang.org/">TypeScript: JavaScript With Syntax For Types.</a>
    </h2>
    <a class="result__snippet" href="#">Sitio oficial &amp; documentación.</a>
  </div>
</div>
`;

describe("search", () => {
  it("decodifica enlaces de redirección de DuckDuckGo", () => {
    expect(resolveDdgUrl("//duckduckgo.com/l/?uddg=https%3A%2F%2Fejemplo.com%2Fx&amp;rut=1")).toBe(
      "https://ejemplo.com/x"
    );
    expect(resolveDdgUrl("https://directo.com/a")).toBe("https://directo.com/a");
  });

  it("extrae título, URL real y snippet limpios", () => {
    const results = parseDdgResults(FIXTURE);
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("TypeScript Wikipedia");
    expect(results[0].url).toBe("https://es.wikipedia.org/wiki/TypeScript");
    expect(results[0].snippet).toContain("tipado");
    expect(results[1].url).toBe("https://www.typescriptlang.org/");
    expect(results[1].snippet).toContain("Sitio oficial & documentación.");
  });

  it("devuelve vacío si no hay resultados", () => {
    expect(parseDdgResults("<html><body>sin resultados</body></html>")).toEqual([]);
  });
});
