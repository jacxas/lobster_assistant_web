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
# Install pnpm (if you don't have it)
npm install -g pnpm

# Install all dependencies
pnpm install

# Start everything in dev mode
pnpm dev

# Or start individually:
pnpm dev:web      # Frontend only (port 5173)
pnpm dev:server   # API only (port 3000)
pnpm dev:bot      # Bots only (requires config.json)
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

## Shared Package

The `@lobster/shared` package contains:
- **Types** (`ChatMessage`, `BotConfig`, `ChatSession`, etc.)
- **Constants** (`COOKIE_NAME`, `SYSTEM_PROMPT`, `DEFAULT_MODEL`, etc.)
- Used by `apps/web`, `apps/server`, and `apps/bot`

## License

MIT - ¡EXFOLIAR! 🦞
