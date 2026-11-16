// Búsqueda web sin API key: DuckDuckGo HTML + parseo de resultados.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const clean = (value: string): string =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Resuelve los enlaces de redirección de DDG (/l/?uddg=...) a la URL real. */
export function resolveDdgUrl(href: string): string {
  const decoded = href.replace(/&amp;/g, "&");
  if (!decoded.includes("uddg=")) return decoded.startsWith("//") ? `https:${decoded}` : decoded;
  const match = /[?&]uddg=([^&]+)/.exec(decoded);
  if (!match) return decoded;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return decoded;
  }
}

export function parseDdgResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  const blocks = html.split(/class="[^"]*result__body[^"]*"/i).slice(1);
  const source = blocks.length > 0 ? blocks : [html];
  for (const block of source) {
    const link = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!link) continue;
    const snippet = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    results.push({
      title: clean(link[2]),
      url: resolveDdgUrl(link[1]),
      snippet: snippet ? clean(snippet[1]).slice(0, 240) : "",
    });
  }
  return results;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`la búsqueda respondió ${res.status}`);
  const html = await res.text();
  return parseDdgResults(html);
}
