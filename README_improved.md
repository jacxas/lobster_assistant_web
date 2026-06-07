# 🦞 Lobster Assistant

> Your privacy-first AI assistant that lives on your machine and chats through WhatsApp, Discord, Telegram, and Slack.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange)](https://pnpm.io)

## Why Lobster?

Every AI assistant sends your conversations to the cloud. Lobster doesn't. Everything runs on your hardware, with zero data leaving your machine (except the messages you send to your chat platforms).

Also, lobsters are cool. They exfoliate by shedding their shells. We respect that.

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm, Ollama with a model downloaded
ollama pull tinyllama

# Clone and install
git clone https://github.com/jacxas/lobster_assistant_web.git
cd lobster_assistant_web
pnpm install

# Interactive setup
node src/bot/setup.js

# Launch!
node src/bot/index.js
```

## Features

- 🔐 **100% Local** — Powered by [Ollama](https://ollama.com). Zero cloud.
- 📱 **Multi-Platform** — WhatsApp, Discord, Telegram, Slack
- 🧠 **Context Memory** — Remembers your conversation thread
- ⚡ **Fast** — No API latency, runs at hardware speed
- 🎨 **Customizable** — Swap models, tweak personality
- 🌊 **Quirky** — Marine metaphors included at no extra charge

## Supported Models

| Model | Size | Use Case |
|-------|------|----------|
| TinyLlama 1.1B | ~1GB | Low-end hardware, fast responses |
| Llama3 8B | ~5GB | Balanced quality and speed |
| Mistral 7B | ~4GB | Strong instruction following |

## Documentation

- [Full Documentation](docs/README.md)
- [Business Strategy](docs/BUSINESS.md)
- [Web App Setup](client/README.md)

## Project Structure

```
lobster_assistant_web/
├── src/bot/          # Core bot logic
│   ├── index.js      # Entry point
│   ├── lobster.js    # Personality & Ollama integration
│   ├── setup.js      # Interactive config wizard
│   ├── discord.js    # Discord adapter
│   ├── telegram.js   # Telegram adapter
│   └── whatsapp.js   # WhatsApp adapter
├── client/           # Web frontend (React + Vite)
├── server/           # Backend API
└── shared/           # Shared types/utils
```

## License

MIT — do whatever you want, just don't blame the lobster.

---

*¡EXFOLIAR! 🦞*