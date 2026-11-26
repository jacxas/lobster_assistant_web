# Lanzamiento de Lobster v1.0.0 — textos listos

Todo lo de abajo se puede copiar tal cual. Los datos son verificables: repo público, release con dos paquetes, demo real.
Regla que seguí: **no prometer nada que el producto no haga** y decir los límites antes de que los pregunten.

Enlaces para pegar:
- Landing: https://lobster.xo.je
- Repo: https://github.com/jacxas/lobster_assistant_web
- Descarga (portable, sin Node): https://github.com/jacxas/lobster_assistant_web/releases/download/v1.0.0/lobster-portable-v1.0.0.zip
- Demo (GIF): https://lobster.xo.je/demo.gif

---

## 1. Show HN (inglés)

**Título** (elegí uno):
- `Show HN: Lobster – A Windows AI assistant that runs on your PC and can touch files`
- `Show HN: Local-first AI assistant with 23 tools and a permission engine`

**Cuerpo:**

```
I built Lobster because I wanted an assistant that could actually work with my files without uploading them anywhere, and that didn't charge me per token.

What it does:
- Chat with per-session memory stored in a local SQLite file.
- An agent with 23 tools: read/write files, run whitelisted commands, web search (no API key), screenshots, clipboard, notes, and DOM-based browser control via Playwright.
- Two interchangeable "brains", switchable from the chat itself: a free cloud API (Gemini/Groq/Cerebras/OpenRouter, your key) or a bundled llama.cpp server running a local GGUF model.
- A permission engine: every tool has a risk level (low/medium/high/critical) that maps to allow/confirm/block, plus secret detection and destructive-command blocking. Mouse clicks are preview-only by default.
- Optional Telegram bot that shares the same memory and tools.

Honest limitations:
- Windows only for now.
- The local mode is slow on old hardware: I tested on a 2011 AMD E-350 (2 cores, 3.5 GB RAM) and it does ~0.2 tok/s — 1-3 minutes per answer. Cloud is ~100x faster. Local is for short answers and offline use.
- No digital signature on the .exe yet (SmartScreen will warn).

Stack: TypeScript, Express, SQLite (better-sqlite3), React + Vite, llama.cpp. MIT licensed. The portable build bundles its own Node runtime, so there's nothing to install: unzip and run Lobster.exe (62 MB).

Happy to answer anything about the permission model or the local engine tuning — that was most of the work.
```

---

## 2. Reddit — r/selfhosted (inglés)

**Título:** `Lobster: a local-first AI assistant for Windows with 23 tools, a permission engine and an optional local LLM`

```
I've been building this for a while and finally packaged v1.0.0.

The pitch: the panel, the memory and the tools run on your machine. You pick the brain — a free cloud API with your own key, or a local model via llama.cpp (bundled, no Ollama).

What I think is worth your time:
- Permission engine: tools are classified by risk and resolved as allow / confirm / block. There's secret detection (API keys, tokens) and destructive-command blocking, so an "agent with shell access" isn't just a footgun.
- Two packages: portable (62 MB, self-contained Node runtime, unzip + double click) and source (25 MB, Node 20+).
- No telemetry. Everything lives in a SQLite file next to the app.

What it's not: it's not a ChatGPT replacement, and local inference on old CPUs is slow (measured 0.2 tok/s on a 2011 E-350 — 1-3 min per response). I put that on the landing page rather than hide it.

Repo: https://github.com/jacxas/lobster_assistant_web (MIT)
Demo: https://lobster.xo.je/demo.gif

Feedback on the permission model is especially welcome.
```

---

## 3. Reddit — r/LocalLLaMA (inglés)

**Título:** `Bundled llama.cpp engine + curated model catalog (0.5B–3B) inside a desktop assistant — measurements on a 2011 CPU`

```
I integrated llama-server (llama.cpp builds) into a Windows desktop assistant so users don't need Ollama or any external service. Some findings from testing on the worst hardware I had (AMD E-350, 2 cores, 3.5 GB RAM):

- Cold start of the engine: 16-25 s for a 1B Q4 model.
- Prompt prefill is the real bottleneck: ~200 s the first time for a ~350 token system prompt. Once llama.cpp has the prefix cached, TTFT drops to ~3.5 s. So I warm the cache in the background right after switching to local.
- Generation: 0.15-0.24 tok/s. Qwen 2.5 0.5B was NOT faster than Llama 3.2 1B — the 151k vocabulary dominates the cost, not the parameter count.
- Forcing response_format: json_object is essential for a small model to keep the tool-calling protocol intact.
- Default threads were floor(cpus/2), which left a core idle on a dual-core; using all cores helps.

Model catalog is 4 curated GGUFs (Qwen 0.5B/1.5B/3B, Llama 1B) with resumable download and size verification, instead of "browse 10k models".

Repo: https://github.com/jacxas/lobster_assistant_web — engine code is in apps/server/services/engine.ts, warmup in ollama.ts.
```

---

## 4. Reddit / foros en español

**Título:** `Lobster: asistente de IA que corre en tu PC, con 23 herramientas y permisos por riesgo`

```
Después de varias semanas, publiqué la v1.0.0.

Qué es: un asistente para Windows que corre en tu máquina. Chatea con memoria, ejecuta tareas (leer/escribir archivos, comandos de una lista blanca, búsqueda web sin API key, capturas, navegador) y también responde por Telegram.

Lo que me parece distinto:
- Podés elegir el cerebro desde el chat: una API gratuita con tu clave (Gemini/Groq/Cerebras) o un modelo local con llama.cpp incluido (sin Ollama).
- Motor de permisos: cada herramienta tiene un riesgo y se resuelve como permitir / confirmar / bloquear. Detecta secretos y bloquea comandos destructivos. Los clics están en vista previa por defecto.
- Sin telemetría: todo queda en un SQLite al lado del programa.

Lo que no es: no reemplaza a ChatGPT y el modo local es lento en hardware viejo. Medí en una AMD E-350 de 2011: ~0,2 tokens/s, entre 1 y 3 minutos por respuesta. Prefiero decirlo antes de que lo descubras.

Descarga portable (62 MB, sin instalar nada): https://github.com/jacxas/lobster_assistant_web/releases/latest
Demo: https://lobster.xo.je/demo.gif

Es MIT. Se agradecen críticas al modelo de permisos, que es la parte que más laburo me llevó.
```

---

## 5. Telegram / WhatsApp (mensaje personal, 4 líneas)

```
🦞 Les comparto Lobster, lo que estuve armando: un asistente de IA que corre en tu PC.

Chatea, mueve archivos, busca en la web y también te contesta por Telegram. Elegís el cerebro: nube gratis o modelo local sin internet.

Se baja (62 MB), se descomprime y se hace doble clic. Windows.
👉 https://github.com/jacxas/lobster_assistant_web/releases/latest

Si lo prueban y algo se rompe, me dicen y lo arreglo.
```

Versión todavía más corta:

```
🦞 Lobster: asistente de IA para Windows que corre en tu PC (nube gratis o modelo local). 62 MB, sin instalar nada.
https://github.com/jacxas/lobster_assistant_web/releases/latest
```

---

## 6. X / Twitter (hilo de 4)

```
1/ Publiqué Lobster v1.0.0: un asistente de IA que corre en tu PC, con 23 herramientas y memoria local.

Sin telemetría. Sin pagar tokens. Windows, MIT. 🦞

2/ Dos cerebros intercambiables desde el chat: una API gratuita con tu clave, o un modelo local con llama.cpp incluido (nada de Ollama).

3/ Lo que más laburo me llevó: el motor de permisos. Cada herramienta tiene riesgo low/medium/high/critical → permitir, confirmar o bloquear. Detecta secretos y frena comandos destructivos.

4/ Lo honesto: el modo local es lento en CPUs viejas (medí 0,2 tok/s en una E-350 de 2011 → 1-3 min por respuesta). La nube vuela.

Demo: https://lobster.xo.je/demo.gif
Descarga: https://github.com/jacxas/lobster_assistant_web/releases/latest
```

---

## 7. Respuestas a comentarios difíciles (preparadas)

**"¿Es otro wrapper de ChatGPT?"**
> No. El agente corre acá: las herramientas tocan tus archivos y tu sistema, el historial es un SQLite tuyo, y el cerebro es intercambiable (incluso local, sin internet). Lo que sí usa es el protocolo OpenAI para hablar con cualquier proveedor.

**"¿Y si el agente borra algo?"**
> Hay un motor de permisos: los comandos van por lista blanca y los destructivos se bloquean o piden confirmación. Igual es software: recomiendo probarlo en una carpeta de prueba las primeras veces. En la v1 no hay sandbox a nivel de sistema operativo.

**"¿Por qué Windows solamente?"**
> Porque el 90% de mi tiempo fue el panel, el motor y los permisos. Linux/macOS es sobre todo empaquetado; está en la lista.

**"¿Por qué no usás Ollama?"**
> Porque quería que el usuario no dependa de un servicio externo: el binario de llama.cpp viaja con la app y el modelo se descarga desde el catálogo. Menos piezas, menos soporte.

**"0,2 tokens/s es inusable"**
> Sí, en esa PC. Lo medí y lo publiqué justamente para no vender humo: el modo local sirve para respuestas de una frase y para trabajar sin internet. Para conversar, la nube gratuita es ~100× más rápida.

**"¿Dónde está el código?"**
> https://github.com/jacxas/lobster_assistant_web — MIT. El motor de permisos está en `apps/server/services/permissions.ts` y el del motor local en `apps/server/services/engine.ts`.

**"SmartScreen dice que es peligroso"**
> Porque el .exe no está firmado (un certificado cuesta ~u$s 300/año). Podés compilarlo vos: el código y el script `scripts/empaquetar-portable.ps1` están en el repo.

---

## 8. Dónde publicar (y qué respetar)

| Lugar | Idioma | Cuidado con |
|---|---|---|
| Hacker News (Show HN) | inglés | Publicar martes/miércoles 8-10 ET; responder todo el primer día |
| r/selfhosted | inglés | Leer reglas de self-promo: suele pedir participación previa |
| r/LocalLLaMA | inglés | Les interesa lo técnico (tokens/s, prefill), no el marketing |
| r/SideProject, r/opensource | inglés | Título directo, sin superlativos |
| r/devsarg, r/programacion | español | Tono personal, contar el proceso |
| Telegram/WhatsApp propio | español | Mensaje corto, sin audio de 5 minutos |
| Product Hunt | inglés | Necesita tagline + 3 capturas + el GIF |

**Regla de oro:** responder con datos. Si alguien dice "lento", contestar con el número medido y el contexto del hardware. Eso genera más confianza que cualquier claim.

---

## 9. Checklist antes de publicar

- [ ] Revocar los tokens que circularon en el chat y verificar que el repo no tenga secretos (`.env` fuera de git).
- [ ] Probar el portable en una PC distinta a la de desarrollo.
- [ ] Confirmar que el link de descarga responde (HTTP 200) y que el archivo pesa 61,5 MB.
- [ ] Tener a mano el GIF y 2-3 capturas por si piden screenshots.
- [ ] Decidir qué hacer si alguien pide soporte: ¿issues de GitHub solamente?
