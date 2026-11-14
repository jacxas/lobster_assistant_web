import { chromium, type Browser, type Page } from "playwright-core";

// Navegador aislado: perfil nuevo en cada arranque (sin cookies, sin logins del usuario).
let browser: Browser | null = null;
let page: Page | null = null;

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max)}… [truncado]`;

async function ensurePage(): Promise<Page> {
  if (page && !page.isClosed()) return page;
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      channel: "chrome",
      headless: true,
      timeout: 30_000,
      args: ["--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions"],
    });
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-AR" });
  page = await context.newPage();
  page.setDefaultTimeout(15_000);
  return page;
}

export async function browserOpen(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL inválida");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("solo se permiten URLs http/https");
  }
  const p = await ensurePage();
  const res = await p.goto(parsed.toString(), { waitUntil: "domcontentloaded", timeout: 25_000 });
  const status = res?.status() ?? 0;
  const title = await p.title().catch(() => "");
  const text = (await p.locator("body").innerText({ timeout: 8000 }).catch(() => "")) || "";
  return `Navegador → ${parsed.toString()} (HTTP ${status})\nTítulo: ${title}\nTexto:\n${truncate(text.trim() || "(sin texto visible)", 3000)}`;
}

export async function browserRead(): Promise<string> {
  const p = await ensurePage();
  const url = p.url();
  const title = await p.title().catch(() => "");
  const text = (await p.locator("body").innerText({ timeout: 8000 }).catch(() => "")) || "";
  return `Página actual: ${url}\nTítulo: ${title}\nTexto:\n${truncate(text.trim() || "(sin texto visible)", 3000)}`;
}

export async function browserClick(target: string): Promise<string> {
  const p = await ensurePage();
  const bySelector = p.locator(target).first();
  if ((await bySelector.count()) > 0) {
    await bySelector.click();
    return `Clic en selector "${target}" ✓`;
  }
  await p.getByText(target, { exact: false }).first().click();
  return `Clic en texto "${target}" ✓`;
}

export async function browserType(target: string, text: string): Promise<string> {
  const p = await ensurePage();
  let field = p.locator(target).first();
  if ((await field.count()) === 0) {
    field = p.getByPlaceholder(target, { exact: false }).first();
  }
  if ((await field.count()) === 0) {
    field = p.getByLabel(target, { exact: false }).first();
  }
  await field.fill(text);
  return `Texto escrito en "${target}" ✓`;
}

export async function browserClose(): Promise<string> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
    page = null;
    return "Navegador cerrado.";
  }
  return "El navegador ya estaba cerrado.";
}
