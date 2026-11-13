# 🦞 Lobster Bot — Multi-plataforma

Bots de Telegram, Discord, WhatsApp y Slack para el Asistente Lobster.

**Cerebro unificado**: los bots no hablan directo con Ollama — llaman al
endpoint `/api/chat` de `apps/server`, que define la personalidad, guarda el
historial en SQLite y aplica rate limiting. Un solo cerebro, una sola memoria.

## Requisitos

- El server Lobster corriendo: `pnpm dev:server` (desde la raíz del repo)
- Node.js 20+

## Configuración

Ejecutá el wizard desde la raíz del repo:

```bash
pnpm setup
```

O creá un archivo `.env` en esta carpeta (`apps/bot/.env`) con:

```env
# Server al que le hablan los bots (cerebro unificado)
LOBSTER_SERVER_URL=http://127.0.0.1:3000

# Al menos uno de estos tokens es necesario
TELEGRAM_TOKEN=tu_token_aqui
DISCORD_TOKEN=tu_token_aqui
WHATSAPP_ENABLED=true
SLACK_TOKEN=tu_token_aqui
SLACK_APP_TOKEN=tu_app_token_aqui  # Solo para Slack (Socket Mode)

# Opcional: omite el rate limit del server (misma clave que el server)
INTERNAL_API_KEY=
```

## Ejecución

```bash
pnpm dev:bot    # desde la raíz del repo
```

## Plataformas soportadas

| Plataforma | Variable de entorno | Estado |
|---|---|---|
| Telegram | `TELEGRAM_TOKEN` | ✅ Listo |
| Discord | `DISCORD_TOKEN` | ✅ Listo |
| WhatsApp | `WHATSAPP_ENABLED=true` | ✅ Listo (escanear QR) |
| Slack | `SLACK_TOKEN` + `SLACK_APP_TOKEN` | ✅ Listo (opcional `@slack/bolt`) |

## Memoria

Cada chat conserva su conversación: el server deriva la sesión
`platform:chatId` (p. ej. `discord:123456`) y guarda el historial en SQLite.
Última actualización: 2026-10-24
