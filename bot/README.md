# 🦞 Lobster Bot — Conectores de Mensajería

Este directorio contiene los conectores del bot para cada plataforma de mensajería.

## Archivos

| Archivo | Descripción |
|---|---|
| `index.js` | Entry point principal — carga conectores según `.env` |
| `lobster.js` | Core del asistente — conecta con Ollama local |
| `discord.js` | Conector para Discord |
| `telegram.js` | Conector para Telegram |
| `whatsapp.js` | Conector para WhatsApp (via Baileys) |
| `setup.js` | Wizard interactivo de configuración |

## Uso

```bash
cd bot
npm install
node setup.js   # Configurar tokens
node index.js   # Iniciar el bot
```

## Variables de entorno requeridas

```env
OLLAMA_URL=http://127.0.0.1:11434/api/generate
MODEL=tinyllama
TELEGRAM_TOKEN=
DISCORD_TOKEN=
WHATSAPP_ENABLED=false
SLACK_TOKEN=
```
