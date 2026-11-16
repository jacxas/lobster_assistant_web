import { execFile } from "node:child_process";
import fs from "node:fs";

/** Apps permitidas: alias -> ejecutable o ruta conocida. */
const APPS: Record<string, string> = {
  notepad: "notepad.exe",
  bloc: "notepad.exe",
  "bloc de notas": "notepad.exe",
  notas: "notepad.exe",
  calculadora: "calc.exe",
  calc: "calc.exe",
  calculator: "calc.exe",
  paint: "mspaint.exe",
  explorador: "explorer.exe",
  explorer: "explorer.exe",
  archivos: "explorer.exe",
  chrome: "chrome",
  navegador: "chrome",
  google: "chrome",
};

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

/** Normaliza "C:\\Windows\\System32\\notepad.exe" -> "notepad". */
export function normalizeAppName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^.*[\\/]/, "")
    .replace(/\.exe$/, "");
}

/** Resuelve el alias a un comando concreto; lanza error con la lista si no está permitido. */
export function resolveApp(name: string): string {
  const key = normalizeAppName(name);
  const target = APPS[key] ?? APPS[name.trim().toLowerCase()];
  if (!target) {
    throw new Error(`app no permitida: "${name}". Permitidas: ${Object.keys(APPS).join(", ")}`);
  }
  if (target === "chrome") {
    const found = CHROME_PATHS.find((candidate) => fs.existsSync(candidate));
    if (!found) throw new Error("no encontré Chrome instalado en las rutas habituales");
    return found;
  }
  return target;
}

export function openApp(name: string): Promise<string> {
  const target = resolveApp(name);
  // El target sale del allowlist (nunca de input libre): sin riesgo de inyección.
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-Command", `Start-Process -FilePath '${target}'`],
      { timeout: 15_000, windowsHide: true },
      (error) =>
        error
          ? reject(
              new Error(
                `no se pudo abrir "${name}" en este sistema (${error.message.trim().slice(0, 120)}). Probá con otra: calculadora, paint, explorador, chrome.`
              )
            )
          : resolve(`Abriendo ${name} (${target})`)
    );
  });
}
