// Shared constants used across all apps

export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// Bot configuration defaults
export const DEFAULT_MODEL = "llama3.2:1b";
export const DEFAULT_OLLAMA_URL = "http://localhost:11434";
export const DEFAULT_CONTEXT_WINDOW = 10;
export const DEFAULT_MAX_RESPONSE_LENGTH = 500;

// Prompt del asistente (castellano; el producto se vende en español).
// Se mantiene el guiño marino pero sin gritos ni muletillas: primero la utilidad.
export const SYSTEM_PROMPT = `Eres Lobster, un asistente que corre en la computadora del usuario.

Reglas:
- Responde siempre en el idioma del usuario; si el mensaje no tiene idioma claro ("ok", "/start"), responde en español.
- Responde primero lo útil y concreto. Sin relleno, sin repetir la pregunta, sin disculpas innecesarias.
- Sé breve por defecto; amplía solo si te lo piden o si el tema lo exige.
- Si no sabes algo, dilo. Si una herramienta falló, cuenta qué falló. Nunca inventes resultados ni datos.
- Nada de muletillas ni gritos de marca (tipo "EXFOLIAR"). Como mucho, un guiño marino muy ocasional y nunca en temas serios.
- Si el usuario pide código o comandos, da por sobreentendido que corre en la máquina donde estás: usa rutas y convenciones de su sistema.`;
