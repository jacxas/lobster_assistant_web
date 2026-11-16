# 📋 PLAN V1 — Lobster (2 semanas)

> Objetivo: **Lobster v1.0 vendible** (plan Eco gratis, BYOK) + **Aglaia como skin Pro ("Concierge")**.
> Regla de trabajo: ramas `ai/*`, tests antes de mergear, `main` siempre verde, verificación en navegador o API real.

---

## Semana 1 — Que se instale y sirva todos los días

### D1–D2 · Instalador de un clic ✅ (en curso)
- `instalar.bat` mejorado: chequea git/node/ollama → `pnpm install` → **crea `.env`** si falta → build → **arranca**.
- `arrancar-lobster.bat` como recuperación rápida (ya existe).
- **DoD**: en una PC limpia, doble clic y en <10 min queda corriendo con chat respondiendo.

### D3–D5 · Herramientas cotidianas (profundidad, no cantidad)
| Herramienta | Qué hace | DoD |
|---|---|---|
| `search_web` | Búsqueda real (Gemini grounding o DuckDuckGo HTML) con 3 resultados resumidos | Devuelve fuentes y responde con datos del día |
| `note_save` / `note_list` | Notas en SQLite por sesión ("anotá que…") | Persisten entre reinicios |
| `file_search` | Buscar archivos por nombre/patrón en carpetas permitidas | Encuentra y devuelve ruta + tamaño |
| `open_app` | Abrir apps comunes (notepad, calc, chrome, explorer) | Abre y confirma |
| `summarize_url` | `fetch_url` + resumen de 5 líneas | Resumen fiel, sin inventar |
- **DoD**: cada herramienta con 1 test hermético + 1 prueba real documentada.

### D6–D7 · Onboarding y pulido
- Wizard `/setup`: detectar si falta `LLM_API_KEY` y guiar paso a paso (link a AI Studio).
- Chat: estados de error claros ("sin cuota", "sin conexión", "modelo no disponible").
- Mensajes de la landing alineados con lo que realmente hace.
- **DoD**: 45+ tests, `tsc` verde, 0 errores en consola al usar el chat 10 minutos.

---

## Semana 2 — Que no se caiga y se pueda entregar

### D8–D9 · Confiabilidad
- **API en modo producción** (1 proceso, sin tsx watcher) + `start` en el .bat.
- **Watchdog** opcional: relanza API si muere (script + tarea de inicio).
- Manejo de RAM: límites de contexto, cierre de navegador headless tras inactividad, aviso en UI si queda <300 MB.
- **Backup SQLite** diario a `apps/.data/backups/`.
- **DoD**: 24 h corriendo sin caídas; si matás el proceso, vuelve solo.

### D10–D11 · Empaquetado
- `pnpm build` completo + `dist/` del web servido por el API (un solo puerto).
- Instalador: ZIP release + icono 🦞 + acceso directo en el escritorio.
- (Opcional) Tauri: unificar con `aglaia-os` de H: como cáscara de escritorio.
- **DoD**: release `v1.0.0` en GitHub con ZIP funcionando en otra PC.

### D12 · Aglaia = Lobster Concierge (skin Pro)
- Su **PermissionEngine ya está portado** (commit `113e323`).
- Portar 2 paneles: `AgentAnalyticsDashboard` + `AgentLogTimeline` como ruta `/pro`.
- Tema "lujo" (dorado/oscuro) como modo visual alternativo.
- **DoD**: `/pro` muestra métricas reales y permisos; `main` sigue verde.

### D13 · Venta y bots
- Landing: precios finales, 2-3 capturas reales, sección "instalación en 3 pasos".
- Bots nuevos (Lobster + Aglaia): actualizar `config.ts` (`TELEGRAM_BOT`), `.env` del bot, re-zip de la landing.
- **DoD**: `lobster.xo.je` actualizada; ambos bots responden con su nombre y logo.

### D14 · Release
- CHANGELOG, tag `v1.0.0`, README final, GIF de 30 s (instalar → preguntar → ver herramienta en acción).
- **DoD**: un desconocido puede instalar y usar sin tu ayuda.

---

## Riesgos y mitigación
| Riesgo | Mitigación |
|---|---|
| RAM 3.5 GB mata procesos | API producción + watchdog + cerrar Chrome al probar |
| Cuota gratis de Gemini | Fallback OpenRouter/Ollama ya implementado; BYOK documentado |
| Scope creep (más paneles, más tools) | Regla: **nada nuevo de UI** hasta el release |
| Dos productos compitiendo | Aglaia queda como skin/Pro; un solo cerebro (Lobster) |

## Métricas de éxito
- Instalación < 10 min en PC limpia.
- 45+ tests, `tsc` verde, 0 warnings críticos.
- 24 h sin caídas.
- 5 tareas reales por día resueltas por el agente sin intervención.
- Release público `v1.0.0` + landing actualizada.
