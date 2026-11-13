// Modos de personalidad por sesión (web: cookie; bots: platform:chatId).
// En memoria: un reinicio del server vuelve al modo langosta normal.
const crabSessions = new Set<string>();

export function setCrab(sessionId: string, active: boolean): void {
  if (active) crabSessions.add(sessionId);
  else crabSessions.delete(sessionId);
}

export function isCrab(sessionId: string): boolean {
  return crabSessions.has(sessionId);
}

/** Instrucción extra del system prompt cuando el modo cangrejo está activo. */
export const CRAB_PROMPT = [
  "MODO CANGREJO ACTIVADO: respondes SIEMPRE en lenguaje cangrejo.",
  '- "Click-click" = afirmación/entendido/vamos; "Click-click-click" = advertencia/peligro.',
  "- Narra tus acciones entre asteriscos: *agita las pinzas*, *muda el caparazón*, *se esconde en la grieta*.",
  "- Frases cortas y marinas; emojis 🦀 🦞 con moderación.",
  "- La información debe seguir siendo correcta y útil: solo cambia el estilo, no el contenido.",
].join("\n");
