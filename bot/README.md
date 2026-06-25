# 🦞 Lobster Bot — Multi-plataforma

Bot de IA local que conecta Ollama con Telegram, Discord, WhatsApp y Slack.

## Instalación

```bash
cd bot
npm install
# o si usás pnpm:
pnpm install
```

## Configuración

Ejecutá el wizard:

```bash
node setup.js
```

O creá un archivo `.env` en esta carpeta con:

```env
# Al menos uno de estos tokens es necesario
TELEGRAM_TOKEN=tu_token_aqui
DISCORD_TOKEN=tu_token_aqui
WHATSAPP_ENABLED=true
SLACK_TOKEN=tu_token_aqui
SLACK_APP_TOKEN=tu_app_token_aqui  # Solo para Slack (Socket Mode)

# Configuración de Ollama (opcional, estos son los valores por defecto)
OLLAMA_URL=http://127.0.0.1:11434/api/generate
MODEL=tinyllama
```

## Ejecución

```bash
node index.js
```

## Requisitos

- [Ollama](https://ollama.ai) corriendo localmente con algún modelo instalado (`ollama pull tinyllama`)
- Node.js 18+

## Plataformas soportadas

| Plataforma | Variable de entorno | Estado |
|---|---|---|
| Telegram | `TELEGRAM_TOKEN` | ✅ Listo |
| Discord | `DISCORD_TOKEN` | ✅ Listo |
| WhatsApp | `WHATSAPP_ENABLED=true` | ✅ Listo (escanear QR) |
| Slack | `SLACK_TOKEN` + `SLACK_APP_TOKEN` | ✅ Listo (requiere `pnpm add @slack/bolt`) |
