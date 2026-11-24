// Captura la app real (panel + chat + selector de cerebro + modelos) para armar
// el GIF de producto. Usa playwright-core con el Chrome del sistema.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, rm } from "node:fs/promises";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const require = createRequire(path.join(repo, "apps", "server", "index.ts"));
const { chromium } = require("playwright-core");

const SALIDA = process.env.DEMO_DIR || path.join(repo, ".data", "demo");
const APP = process.env.DEMO_URL || "http://localhost:5173/";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  await rm(SALIDA, { recursive: true, force: true });
  await mkdir(SALIDA, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: 1 });

  const shot = async (nombre) => {
    const ruta = path.join(SALIDA, `${nombre}.png`);
    await page.screenshot({ path: ruta });
    console.log(`[captura] ${nombre}`);
  };

  console.log("[1] dashboard");
  await page.goto(APP, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Vite mantiene un websocket abierto: no se puede esperar "networkidle".
  await page.waitForSelector("text=Lobster OS", { timeout: 60000 });
  await esperar(3000);
  await shot("01-dashboard");

  console.log("[2] chat vacio");
  await page.getByRole("button", { name: /Abrir Assistant/i }).first().click().catch(async () => {
    await page.locator('button:has-text("Chat")').first().click();
  });
  await esperar(1500);
  await shot("02-chat");

  console.log("[3] conversacion real (modo agente)");
  const caja = page.locator('input[placeholder*="Escribe"]').first();
  await caja.click();
  await caja.fill("decime en una frase que podes hacer en mi PC");
  await esperar(400);
  await shot("03-escribiendo");
  await page.locator('button[title="Enviar"]').first().click();

  // 1) frame intermedio mientras genera
  await esperar(1500);
  await shot("04-generando");

  // 2) espera a que termine el streaming: desaparece el botón Detener
  for (let i = 0; i < 90; i++) {
    await esperar(1000);
    const generando = await page.locator('button[title="Detener"]').count();
    if (generando === 0) break;
  }
  await esperar(1200);
  const burbujas = await page.locator(".whitespace-pre-wrap").allInnerTexts();
  console.log("  respuesta:", (burbujas[burbujas.length - 1] || "(vacia)").slice(0, 80));
  await shot("05-respuesta");

  console.log("[4] selector de cerebro abierto");
  await page.locator('button[aria-haspopup="menu"]').first().click();
  await esperar(900);
  await shot("06-selector");
  await page.keyboard.press("Escape");
  await esperar(300);

  console.log("[5] panel de modelos");
  await page.getByRole("button", { name: /^Models$/i }).first().click().catch(async () => {
    await page.locator('button:has-text("Models")').first().click();
  });
  await esperar(1800);
  await shot("07-modelos");

  await browser.close();
  console.log(`listo: ${SALIDA}`);
};

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
