<div align="center">

# 🦞 Lobster Assistant

**Asistente de IA 100% local con soporte para WhatsApp, Discord, Telegram y Slack**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black)](https://ollama.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?logo=whatsapp&logoColor=white)](#)
[![Discord](https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white)](#)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](#)
[![Slack](https://img.shields.io/badge/Slack-4A154B?logo=slack&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Privacy-first • No data leaves your machine • Powered by Ollama**

</div>

---

## 🧠 ¿Qué es Lobster Assistant?

Lobster Assistant es un chatbot de IA que corre **100% en tu máquina** usando [Ollama](https://ollama.com). Se integra con las plataformas de mensajería más populares: WhatsApp, Discord, Telegram y Slack. Ningún dato sale de tu hardware.

> 🦞 El Lobster tiene personalidad propia (principalmente sobre exfoliación).

## ✨ Características

- 🔒 **100% Local** — toda la inferencia en tu máquina con Ollama
- 📱 **Multi-plataforma** — WhatsApp, Discord, Telegram, Slack simultáneamente
- 🧠 **Modelos flexibles** — TinyLlama, Llama3, Mistral o cualquier modelo Ollama
- 🔧 **Setup interactivo** — wizard CLI guiado paso a paso
- 💬 **Contexto de conversación** — ventana configurable de mensajes por usuario
- 🤖 **Personalidad customizable** — system prompt editable

## 📱 Requisitos del Sistema

| Componente | Mínimo | Recomendado |
|------------|---------|-------------|
| RAM | 4 GB | 8 GB+ |
| CPU | x64 | Multi-core moderno |
| GPU | No requerida | NVIDIA/AMD para velocidad |
| Storage | 2 GB (TinyLlama) | 10 GB+ (múltiples modelos) |
| OS | Windows 10, macOS 11, Ubuntu 20.04 | Últimas versiones |

## 🚀 Inicio Rápido

```bash
# 1. Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Descargar un modelo
ollama pull tinyllama

# 3. Clonar e instalar
git clone https://github.com/jacxas/lobster_assistant_web.git
cd lobster_assistant_web
pnpm install

# 4. Configurar
node src/bot/setup.js

# 5. Ejecutar
node src/bot/index.js
```

## 📖 Documentación Completa

Para guías detalladas de configuración por plataforma, modelos, troubleshooting y API reference:

📚 **[Ver documentación completa → docs/README.md](./docs/README.md)**

## 📊 Modelos Soportados

| Modelo | Tamaño | RAM | Velocidad | Calidad |
|--------|--------|-----|-----------|--------|
| TinyLlama 1.1B | ~1 GB | 4 GB | Rápido | Básico |
| Mistral 7B | ~4 GB | 8 GB | Medio | Bueno |
| Llama3 8B | ~5 GB | 8 GB | Medio | Bueno |
| Llama3 70B | ~40 GB | 64 GB | Lento | Excelente |

## 🔗 Proyectos Relacionados

- **[lobster-assistant](https://github.com/jacxas/lobster-assistant)** — Código fuente del bot
- **[lobster_assist_web](https://github.com/jacxas/lobster_assist_web)** — Web estática de instalación

## 📄 Licencia

MIT © [jacxas](https://github.com/jacxas)

---

*¡EXFOLIAR! 🦞 Hecho con pinzas y amor desde Buenos Aires.*
