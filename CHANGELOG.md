# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

## [1.0.0] — 2026-11-23

Primera versión empaquetada. Funciona en Windows con nube gratuita o motor local propio.

### Agregado

- **Versión portable sin Node** (`lobster-portable-v1.0.0.zip`, 62 MB): trae su propio runtime, la API compilada, las dependencias de producción y el motor local; se abre con `Lobster.exe`, pide la clave gratis la primera vez y permite detener el servidor desde su ventana.
- **Panel completo**: dashboard con KPIs reales, chat con streaming, panel de modelos, wizard de instalación y landing pública.
- **Agente con 23 herramientas**: archivos, comandos (allowlist), búsqueda web sin API key, URLs, capturas, portapapeles, notas, búsqueda de archivos, abrir apps y navegador controlado por DOM.
- **Selector de cerebro en el chat**: nube gratuita o modelo local, sin salir de la conversación.
- **Motor local propio** con `llama-server` (llama.cpp), sin Ollama ni servicios de terceros.
- **Catálogo curado de modelos**: Qwen 2.5 0.5B (379 MB), Llama 3.2 1B (771 MB), Qwen 2.5 1.5B (940 MB), Qwen 2.5 3B (1,8 GB), con descarga reanudable y verificación.
- **Permisos por riesgo** (`low/medium/high/critical` → permitir/confirmar/bloquear) con anti-secretos y anti-destructivos.
- **Bot de Telegram** con la misma persona y herramientas; modos `/cangrejo` y `/normal`.
- **Modo producción**: panel + API en un solo proceso (`arrancar-lobster.bat`), sin watcher.
- **Persistencia del cerebro elegido** entre reinicios (SQLite).
- **`instalar.bat`** reescrito: Node, pnpm, dependencias, compilación y `.env` en un solo paso.
- Scripts de medición de latencia (`scripts/medir-chat-local.mjs`, `scripts/conv-local.mjs`).

### Cambiado

- **Personalidad**: el prompt del sistema pasó a español neutro, respuestas útiles primero, sin muletillas ni gritos de marca (antes terminaba en "EXFOLIAR!").
- **Modo local adaptado a hardware lento**: tope de salida de 48 tokens, historial recortado a 4 mensajes e instrucción de brevedad.
- **Precalentado del motor** al cambiar a local: el primer mensaje pasó de ~200 s a ~3,5 s (caché de prompt).
- **Uso de CPU**: el motor ahora usa todos los núcleos (antes `cpus/2` dejaba un solo hilo en equipos de 2 núcleos).
- **Textos honestos en la UI**: el chat avisa si el cerebro es nube o local y cuánto puede tardar; el dashboard ya no menciona Ollama.

### Corregido

- **El chat del panel no funcionaba**: hacía streaming contra Ollama (puerto 11434, inexistente) y devolvía `fetch failed`. Ahora usa el cerebro activo con SSE.
- **Manejador de errores de Express** con 3 parámetros: Express lo trataba como middleware normal y cualquier error devolvía un 500 opaco.
- **`LLM_BASE_URL` inválida** (por ejemplo la cadena literal `%LLM_BASE_URL%`) rompía todas las llamadas; ahora se valida y se usa el proveedor por defecto.
- **Motor huérfano** tras reiniciar el server: bloqueaba el puerto y fallaba con "tiempo de espera agotado". Ahora se reutiliza si es el mismo modelo o se libera.
- **Motor local quedaba encendido** al volver a la nube, ocupando ~1 GB. Ahora se apaga (RAM libre: 0,28 GB → 1,2 GB).
- **CORS** solo aceptaba `localhost:5173`; abrir el panel por `127.0.0.1` rompía todas las llamadas.
- **Layout del chat**: el título se partía en dos líneas y "Borrar historial" se cortaba en pantallas chicas.

### Notas

- En una CPU de 2011 (AMD E-350, 2 núcleos) el modo local rinde ~0,2 tokens/s: sirve para respuestas de una frase.
- El modelo de 0,5B usa 10× menos RAM que el de 1B pero no es más rápido generando (el vocabulario de 151k tokens domina).

[1.0.0]: https://github.com/jacxas/lobster_assistant_web/releases/tag/v1.0.0
