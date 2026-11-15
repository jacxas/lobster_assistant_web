// Port del núcleo de PermissionEngine de Aglaia (JACXAS) adaptado al loop síncrono de Lobster.
// Riesgo por herramienta + inspección de argumentos (secretos, destructivos, rutas protegidas)
// → decisión: allow | require_confirmation | block.
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PolicyAction = "allow" | "confirm" | "block";
export type PermissionDecision = "allow" | "require_confirmation" | "block";

export interface PermissionEvaluation {
  risk: RiskLevel;
  decision: PermissionDecision;
  reasons: string[];
  matchedSignals: string[];
}

const RISK_ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

const elevate = (current: RiskLevel, candidate: RiskLevel): RiskLevel =>
  RISK_ORDER[candidate] > RISK_ORDER[current] ? candidate : current;

/** Riesgo base declarado por herramienta (punto de partida de la evaluación). */
export const TOOL_RISK: Record<string, RiskLevel> = {
  list_files: "low",
  read_file: "low",
  sys_info: "low",
  clipboard_get: "low",
  screenshot: "low",
  look: "low",
  fetch_url: "low",
  browser_read: "low",
  browser_close: "low",
  open_url: "medium",
  clipboard_set: "medium",
  browser_open: "medium",
  browser_click: "medium",
  browser_type: "medium",
  click: "medium",
  type_text: "medium",
  run_command: "medium",
};

const DESTRUCTIVE_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /\brm\s+-rf\b/i, label: "rm_rf" },
  { regex: /\b(mkfs|dd\s+if=|format\s+[a-z]:)/i, label: "formateo" },
  { regex: /\b(shutdown|reboot)\b/i, label: "apagado_reinicio" },
  { regex: /\bdel\s+\/[fsq]|\brd\s+\/s|\brmdir\s+\/s/i, label: "borrado_recursivo_windows" },
  { regex: /\breg\s+delete\b/i, label: "borrado_registro" },
  { regex: /\btaskkill\b.*\/f/i, label: "matar_procesos_forzado" },
  { regex: /:\(\)\s*\{/, label: "fork_bomb" },
];

const SECRET_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /sk-(live|test|or-v1)-[A-Za-z0-9_-]{12,}/, label: "clave_stripe_openrouter" },
  { regex: /AIzaSy[a-zA-Z0-9_-]{20,}/, label: "clave_google" },
  { regex: /ghp_[a-zA-Z0-9]{20,}/, label: "token_github" },
  { regex: /postgres:\/\/[^\s"']+:[^\s"']+@/i, label: "credenciales_db" },
  { regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: "clave_privada_pem" },
];

const PROTECTED_PATH = /(c:\\windows\\|\/etc\/|\/root\/|\/var\/db\/)/i;

const RISK_ACTIONS: Record<RiskLevel, PolicyAction> = {
  low: "allow",
  medium: "allow",
  high: "confirm",
  critical: "block",
};

const csv = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Evalúa si una herramienta puede ejecutarse con estos argumentos. */
export function evaluateTool(toolName: string, args: Record<string, unknown>): PermissionEvaluation {
  const baseRisk = TOOL_RISK[toolName] ?? "medium";
  let risk: RiskLevel = baseRisk;
  const reasons: string[] = [];
  const matchedSignals: string[] = [];

  const serialized = JSON.stringify(args ?? {});
  // Los valores crudos (sin escapes de JSON) para detectar rutas tipo C:\\Windows.
  const rawText = Object.values(args ?? {})
    .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
    .join(" \n ");
  const haystack = `${serialized}\n${rawText}`;
  const lowered = haystack.toLowerCase();

  // 1. Patrones destructivos → critical
  let destructive = false;
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.regex.test(haystack)) {
      destructive = true;
      risk = elevate(risk, "critical");
      matchedSignals.push(pattern.label);
      reasons.push(`operación destructiva detectada (${pattern.label})`);
    }
  }

  // 2. Credenciales en los argumentos → high/critical
  let secrets = false;
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.regex.test(haystack)) {
      secrets = true;
      const escalated: RiskLevel = /write|set|type|click|open|command/i.test(toolName) ? "critical" : "high";
      risk = elevate(risk, escalated);
      matchedSignals.push(pattern.label);
      reasons.push(`credencial expuesta en los argumentos (${pattern.label})`);
    }
  }

  // 3. Rutas protegidas del sistema → high
  if (PROTECTED_PATH.test(lowered)) {
    risk = elevate(risk, "high");
    matchedSignals.push("ruta_protegida");
    reasons.push("acceso a una ruta protegida del sistema");
  }

  // 4. Vetos duros por entorno
  const blockedTools = csv(process.env.AGENT_BLOCKED_TOOLS);
  const trustedTools = csv(process.env.AGENT_TRUSTED_TOOLS);
  const strictLocal = process.env.AGENT_STRICT_LOCAL === "1";
  const remoteTools = ["fetch_url", "open_url", "browser_open", "look"];

  if (blockedTools.includes(toolName)) {
    reasons.push(`la herramienta ${toolName} está vetada por AGENT_BLOCKED_TOOLS`);
    return { risk: "critical", decision: "block", reasons, matchedSignals: [...matchedSignals, "veto_herramienta"] };
  }
  if (destructive) {
    return { risk, decision: "block", reasons, matchedSignals };
  }
  if (secrets) {
    return { risk, decision: "block", reasons, matchedSignals };
  }
  if (strictLocal && remoteTools.includes(toolName)) {
    reasons.push("modo estricto local activo: sin red ni navegador");
    return { risk, decision: "block", reasons, matchedSignals: [...matchedSignals, "strict_local"] };
  }
  if (trustedTools.includes(toolName)) {
    return { risk: "low", decision: "allow", reasons: ["herramienta confiable (AGENT_TRUSTED_TOOLS)"], matchedSignals };
  }

  const action = RISK_ACTIONS[risk];
  if (action === "block") {
    reasons.push(`riesgo ${risk} bloqueado por política`);
    return { risk, decision: "block", reasons, matchedSignals };
  }
  if (action === "confirm") {
    if (process.env.AGENT_CONFIRM_ALLOW === "1") {
      reasons.push(`riesgo ${risk} confirmado automáticamente (AGENT_CONFIRM_ALLOW=1)`);
      return { risk, decision: "allow", reasons, matchedSignals };
    }
    return {
      risk,
      decision: "require_confirmation",
      reasons: [...reasons, `riesgo ${risk}: requiere confirmación humana (AGENT_CONFIRM_ALLOW=1 para permitir)`],
      matchedSignals,
    };
  }
  return { risk, decision: "allow", reasons, matchedSignals };
}
