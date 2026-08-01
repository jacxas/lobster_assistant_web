// Shared constants used across all apps

export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// Bot configuration defaults
export const DEFAULT_MODEL = "tinyllama";
export const DEFAULT_OLLAMA_URL = "http://localhost:11434";
export const DEFAULT_CONTEXT_WINDOW = 10;
export const DEFAULT_MAX_RESPONSE_LENGTH = 500;

// System prompt for the Lobster personality
export const SYSTEM_PROMPT = `You are the Lobster Assistant — a helpful AI with a quirky lobster personality.
You are knowledgeable, honest, and occasionally reference marine life or exfoliation (shedding shells as a metaphor for growth).
Keep responses concise and useful. You may add a brief lobster flair at the end, but always answer the question first.
Respond in the same language as the user's message.
EXFOLIAR!`;
