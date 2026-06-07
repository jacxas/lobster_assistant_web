# Lobster Assistant - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Platform Setup](#platform-setup)
7. [Models Guide](#models-guide)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)
11. [Contributing](#contributing)
12. [Changelog](#changelog)

---

## Overview

Lobster Assistant is a privacy-first AI chatbot that runs entirely on your local machine and integrates with popular messaging platforms. Unlike cloud-based AI services, all processing happens on your device — your conversations never leave your hardware.

### Key Features

- **100% Local Processing**: Powered by [Ollama](https://ollama.com), all AI inference runs on your machine
- **Multi-Platform Support**: WhatsApp, Discord, Telegram, and Slack integration
- **Privacy by Design**: No data sent to external servers
- **Customizable Personality**: The Lobster has opinions (mostly about exfoliation)
- **Model Flexibility**: Use TinyLlama, Llama3, Mistral, or any Ollama-compatible model
- **Easy Setup**: Interactive wizard guides you through configuration

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4GB | 8GB+ |
| CPU | Any x64 | Modern multi-core |
| GPU | Not required | NVIDIA/AMD for speed |
| Storage | 2GB (TinyLlama) | 10GB+ (multiple models) |
| OS | Windows 10, macOS 11, Ubuntu 20.04 | Latest versions |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Machine                          │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Ollama    │◄───│   Lobster   │───►│  Platform   │ │
│  │  (AI Core)  │    │    Bot      │    │  Adapters   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                            │                    │       │
│                     ┌──────┴──────┐             │       │
│                     │   Config    │      ┌──────┴─────┐ │
│                     │   Manager   │      │ WhatsApp   │ │
│                     └─────────────┘      │ Discord    │ │
│                                          │ Telegram   │ │
│                                          │ Slack      │ │
│                                          └────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Internet (only    │
                    │  for platform APIs) │
                    └────────────────────┘
```

### Component Overview

**Ollama**: Local LLM server that handles model loading and inference.

**Lobster Bot Core** (`src/bot/lobster.js`): The personality engine. Formats prompts, maintains conversation context, and applies the lobster character.

**Platform Adapters**: Platform-specific code that handles authentication, message receiving, and sending.
- `src/bot/discord.js` - Discord bot
- `src/bot/telegram.js` - Telegram bot
- `src/bot/whatsapp.js` - WhatsApp via whatsapp-web.js

**Config Manager** (`src/bot/setup.js`): Interactive CLI wizard for first-time setup.

---

## Prerequisites

### 1. Node.js (v20+)

```bash
# Check version
node --version  # Should be v20.0.0 or higher

# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. pnpm

```bash
# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Or via npm
npm install -g pnpm

# Verify
pnpm --version
```

### 3. Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download installer from https://ollama.com

# Verify
ollama --version
```

### 4. Download a Model

```bash
# TinyLlama (1.1B params, ~1GB, runs on any machine)
ollama pull tinyllama

# Llama3 (8B params, ~5GB, better quality)
ollama pull llama3

# Mistral (7B params, ~4GB, good balance)
ollama pull mistral

# List downloaded models
ollama list
```

---

## Installation

```bash
# 1. Clone or download
git clone https://github.com/jacxas/lobster_assist_web.git
cd lobster_assist_web

# 2. Install dependencies
pnpm install

# 3. Run setup wizard
node src/bot/setup.js

# 4. Start the bot
node src/bot/index.js
```

### Setup Wizard Walkthrough

The setup wizard (`node src/bot/setup.js`) will ask you:

1. **Which platforms to enable?** (WhatsApp / Discord / Telegram / Slack)
2. **Which Ollama model to use?** (TinyLlama / Llama3 / Custom)
3. **Bot personality level?** (Subtle / Medium / Full Lobster Mode)
4. **Platform-specific tokens** (see Platform Setup section)

A `config.json` file is created in the root directory.

---

## Configuration

### config.json Structure

```json
{
  "model": "tinyllama",
  "ollamaUrl": "http://localhost:11434",
  "personality": "medium",
  "platforms": {
    "telegram": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN"
    },
    "discord": {
      "enabled": false,
      "token": "YOUR_BOT_TOKEN"
    },
    "whatsapp": {
      "enabled": false
    },
    "slack": {
      "enabled": false,
      "botToken": "xoxb-YOUR-TOKEN",
      "signingSecret": "YOUR_SECRET"
    }
  },
  "contextWindow": 10,
  "maxResponseLength": 500
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `model` | `tinyllama` | Ollama model name |
| `ollamaUrl` | `http://localhost:11434` | Ollama API endpoint |
| `personality` | `medium` | `subtle` / `medium` / `full` |
| `contextWindow` | `10` | Messages to keep in memory |
| `maxResponseLength` | `500` | Max characters per response |

---

## Platform Setup

### Telegram

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow prompts to name your bot
4. Copy the token (format: `123456789:ABCdef...`)
5. Add to config: `platforms.telegram.token`

**Enable in config:**
```json
"telegram": {
  "enabled": true,
  "token": "123456789:ABCdefGHI..."
}
```

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application → Add a Bot
3. Enable **Message Content Intent** and **Server Members Intent**
4. Copy the Bot Token
5. Generate invite URL: OAuth2 → URL Generator → Bot → Send Messages, Read Messages
6. Invite bot to your server

**Enable in config:**
```json
"discord": {
  "enabled": true,
  "token": "YOUR_DISCORD_BOT_TOKEN"
}
```

### WhatsApp

1. Enable in config: `"whatsapp": { "enabled": true }`
2. Start the bot: `node src/bot/index.js`
3. A QR code will appear in the terminal
4. Open WhatsApp → Settings → Linked Devices → Link a Device
5. Scan the QR code

**Note**: Keep the bot running to maintain the session. If disconnected, restart and re-scan.

### Slack

1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Create New App → From Scratch
3. Enable **Socket Mode** (for local dev)
4. Add OAuth Scopes: `chat:write`, `chat:write.public`, `im:read`, `channels:read`, `app_mentions:read`
5. Install to workspace
6. Copy Bot Token (xoxb-...) and Signing Secret

**Enable in config:**
```json
"slack": {
  "enabled": true,
  "botToken": "xoxb-YOUR-BOT-TOKEN",
  "signingSecret": "YOUR-SIGNING-SECRET",
  "appToken": "xapp-YOUR-APP-TOKEN"
}
```

---

## Models Guide

### Comparison

| Model | Size | RAM Required | Speed | Quality | Best For |
|-------|------|-------------|-------|---------|----------|
| TinyLlama 1.1B | ~1GB | 4GB | Fast | Basic | Low-end hardware, quick responses |
| Llama3 8B | ~5GB | 8GB | Medium | Good | General use, balanced |
| Mistral 7B | ~4GB | 8GB | Medium | Good | Instruction following |
| Llama3 70B | ~40GB | 64GB | Slow | Excellent | High-end workstations |

### Switching Models

```bash
# Download new model
ollama pull mistral

# Update config.json
# Change "model": "tinyllama" to "model": "mistral"

# Restart the bot
```

### Custom System Prompt

Edit `src/bot/lobster.js` to customize the system prompt:

```javascript
const SYSTEM_PROMPT = `You are the Lobster Assistant, a helpful AI with a quirky lobster personality.
You occasionally reference marine life, exfoliation, and the ocean.
You are helpful, honest, and slightly eccentric.
// Add your customizations here
`;
```

---

## Advanced Features

### Conversation Context

The bot maintains a rolling context window (default: last 10 messages per user). This allows for multi-turn conversations:

```
User: Who invented the telephone?
Bot: Alexander Graham Bell invented the telephone in 1876...
User: How old was he when he invented it?
Bot: Bell was 29 years old... [understands "he" refers to Bell]
```

### Multi-Platform Simultaneously

Run all platforms at once:

```json
{
  "platforms": {
    "telegram": { "enabled": true, "token": "..." },
    "discord": { "enabled": true, "token": "..." },
    "whatsapp": { "enabled": true },
    "slack": { "enabled": true, "botToken": "...", "signingSecret": "..." }
  }
}
```

### Running as a Service

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/bot/index.js --name lobster-assistant

# Auto-start on boot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs lobster-assistant
```

---

## Troubleshooting

### Ollama Not Running

```bash
# Start Ollama
ollama serve

# Check if running
curl http://localhost:11434/api/tags
```

### Bot Not Responding

1. Check Ollama is running: `ollama list`
2. Verify tokens in `config.json`
3. Check console for error messages
4. Ensure intents are enabled (Discord)

### WhatsApp Session Expired

1. Delete `.wwebjs_auth` folder
2. Restart bot
3. Re-scan QR code

### High Memory Usage

- Switch to TinyLlama: `"model": "tinyllama"`
- Reduce context window: `"contextWindow": 5`
- Restart Ollama: `pkill ollama && ollama serve`

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED localhost:11434` | Ollama not running | Start with `ollama serve` |
| `DisallowedIntents` | Discord intents not enabled | Enable in Dev Portal |
| `401 Unauthorized` | Wrong token | Double-check token |
| `Session closed` | WhatsApp disconnected | Re-scan QR code |

---

## API Reference

### Lobster Core API

#### `askLobster(userMessage, conversationHistory)`

Sends a message to Ollama and returns the response.

```javascript
import { askLobster } from './lobster.js';

const response = await askLobster(
  "What's the weather like?",
  [] // empty history for new conversation
);
console.log(response); // "Ah, the currents of meteorology..."
```

#### `formatHistory(messages)`

Formats message history for Ollama's chat API.

```javascript
const history = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Greetings from the deep!' }
];
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/jacxas/lobster_assist_web.git
cd lobster_assist_web
pnpm install
cp config.example.json config.json
# Edit config.json with your tokens
node src/bot/index.js
```

---

## Changelog

### v1.0.0 (2026-06)
- Initial release
- WhatsApp, Discord, Telegram, Slack support
- Ollama integration
- Setup wizard
- Community setups gallery (web)

---

*¡EXFOLIAR! 🦞 Made with pinzas and love.*