# Lobster Assistant — Base44 Dev Environment

## Overview
pnpm workspace monorepo (pnpm 9.15.9, lockfile v9.0):
- `apps/web` — React + Vite 7 frontend (dev port 5173, mapped to host 3000)
- `apps/server` — Express + tsx dev server (internal port 3001)
- `apps/bot` — WhatsApp/Discord/Telegram bots (not run in dev preview)
- `packages/shared` — shared types/constants (Vite aliases directly to `src/`, no build needed for web)

## Running
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Web: `http://localhost:3000` (Vite dev server, live reload)
- Server API: internal only (`/api/status`, `/api/chat` placeholder)
- Both services build from `Dockerfile.dev` which installs workspace deps; source is bind-mounted for live reload

## Key Details
- The web app is a self-contained dashboard UI — it does not make API calls to the server for basic rendering
- `@lobster/shared` is resolved via Vite alias to `packages/shared/src` (no build step needed in dev)
- Vite `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env var is passed for preview host acceptance (Vite >= 6.1)
- The `vite-plugin-manus-runtime` and `@builder.io/vite-plugin-jsx-loc` plugins are loaded dynamically with try/catch — missing packages are silently skipped
- No external secrets required to boot; OAuth/bot tokens are optional
- The root `vite.config.ts` is a leftover from a previous flat structure; the active web config is `apps/web/vite.config.ts`

## Verifying
- `curl -s http://localhost:3000/` → HTML with Vite client scripts (dev mode)
- `curl -s http://localhost:3000/src/main.tsx` → 200 (source served live)
- Server health: `docker compose exec server wget -qO- http://localhost:3001/api/status`
