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
- Server API: internal only; `/api/*` is proxied from Vite to `http://server:3001`
- Ollama: internal only (`ollama` service); `ollama-init` pulls `${OLLAMA_MODEL:-tinyllama}` (637 MB) on first boot
- All services build from `Dockerfile.dev` which installs workspace deps; source is bind-mounted for live reload

## Assistant chat
- `POST /api/chat` accepts either `{ message }` or `{ messages: [{ role, content }] }` and forwards the conversation to Ollama `/api/chat` (non-streaming)
- Uses `OLLAMA_URL` (default `http://localhost:11434`), `OLLAMA_MODEL` (default `tinyllama` from `@lobster/shared/const`) and the shared `SYSTEM_PROMPT`
- Returns `503` with a readable message when Ollama is unreachable or the model is missing
- UI: `apps/web/src/components/AssistantChat.tsx`, rendered by `DesktopShell` when the Assistant tab is active

## Key Details
- `@lobster/shared` is resolved via Vite alias to `packages/shared/src` in the browser and via tsconfig `paths` in tsx; the production Dockerfile copies the builder's `packages/shared/dist` because the server imports `@lobster/shared/const` at runtime
- Vite `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env var is passed for preview host acceptance (Vite >= 6.1)
- The `vite-plugin-manus-runtime` and `@builder.io/vite-plugin-jsx-loc` plugins are loaded dynamically with try/catch — missing packages are silently skipped
- No external secrets required to boot; OAuth/bot tokens are optional
- The root `vite.config.ts` is a leftover from a previous flat structure; the active web config is `apps/web/vite.config.ts`
- `apps/web` `tsc --noEmit` has pre-existing errors (`@types/node` missing, `Map.tsx` Google Maps types, `const.ts` imports `@shared/const`); Vite runs fine. Server type-check passes.

## Verifying
- `curl -s http://localhost:3000/` → HTML with Vite client scripts (dev mode)
- `curl -s http://localhost:3000/src/main.tsx` → 200 (source served live)
- Server health: `docker compose exec server wget -qO- http://localhost:3001/api/status`
- Chat: `curl -s -X POST http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{"message":"What is 2+2?"}'`
