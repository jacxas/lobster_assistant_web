# 🦞 Lobster Assistant (Monorepo)

> Your privacy-first AI assistant - now unified in a single repository.

## What Changed

This repository was migrated from a flat structure to a **pnpm workspace monorepo** to unify code across 4 related repos:
- `lobster-assistant` (was empty)
- `lobster_assistant_web` (this repo - main codebase)
- `lobster_assist_web` (exact duplicate)
- `lobster-assistant-web` (inaccessible)

## New Structure

```
lobster-assistant/
├── apps/
│   ├── web/          # React + Vite frontend (was client/)
│   ├── server/       # Express API + SQLite
│   └── bot/          # WhatsApp, Discord, Telegram bots
├── packages/
│   └── shared/       # Types, constants, utilities shared across apps
├── docs/             # Documentation
├── docker-compose.yml
├── package.json      # Workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

## Quick Start

```bash
# Windows: doble clic en instalar.bat y sigue los pasos

# Install pnpm (if you don't have it)
npm install -g pnpm

# Install all dependencies
pnpm install

# Start everything in dev mode
pnpm dev

# Or start individually:
pnpm dev:web      # Frontend only (port 5173)
pnpm dev:server   # API only (port 3000)
pnpm dev:bot      # Bots only (requires .env with your tokens)
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode via Turbo |
| `pnpm build` | Build all apps for production |
| `pnpm check` | Type-check all TypeScript code |
| `pnpm setup` | Run interactive bot configuration wizard |
| `pnpm db:migrate` | Run database migrations |

## Docker

```bash
# Start all services (Ollama + Server + Bot)
docker compose up -d

# Or individually:
docker compose up -d ollama   # AI model server
docker compose up -d server   # API + web
docker compose up -d bot      # Chat bots
```

## Bots

Configura los tokens con el asistente interactivo:

```bash
pnpm setup   # genera apps/bot/.env (TELEGRAM_TOKEN, DISCORD_TOKEN, etc.)
pnpm dev:bot
```

WhatsApp muestra un código QR en la terminal la primera vez (escanéalo con la app).

## Shared Package

The `@lobster/shared` package contains:
- **Types** (`ChatMessage`, `BotConfig`, `ChatSession`, etc.)
- **Constants** (`COOKIE_NAME`, `SYSTEM_PROMPT`, `DEFAULT_MODEL`, etc.)
- Used by `apps/web` and `apps/server`

## License

MIT - ¡EXFOLIAR! 🦞

---

Última actualización: 2026-10-24
