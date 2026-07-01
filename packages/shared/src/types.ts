// Shared TypeScript types used across all apps

export interface BotConfig {
  model: string;
  ollamaUrl: string;
  personality: string;
  contextWindow: number;
  maxResponseLength: number;
  platforms: {
    telegram: PlatformConfig;
    discord: PlatformConfig;
    whatsapp: PlatformConfig;
    slack: PlatformConfig;
  };
}

export interface PlatformConfig {
  enabled: boolean;
  token?: string;
  sessionName?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  platform: "web" | "telegram" | "discord" | "whatsapp" | "slack";
  createdAt: number;
  lastSeen: number;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

export interface StoredMessage {
  id: number;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  createdAt: number;
}

export interface OllamaChatRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
}

export interface OllamaChatResponse {
  message?: {
    content: string;
    role: string;
  };
  response?: string;
}
