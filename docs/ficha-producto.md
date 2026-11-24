# Ficha de producto — Lobster v1.0.0

Material listo para copiar y pegar en GitHub, tiendas, Product Hunt, Reddit, Telegram o un mail de venta.
Todo lo que dice acá es verificable en el producto: nada de promesas que no estén implementadas.

---

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | **Lobster** (nombre completo: Lobster Assistant) |
| Versión | 1.0.0 (23-11-2026) |
| Categoría | Asistente de IA de escritorio / automatización local |
| Plataforma | Windows 10 y 11 (64 bits) |
| Precio | Gratis (Eco) · u$s 9/mes (Estándar) · u$s 29/mes (Pro) |
| Descarga | https://github.com/jacxas/lobster_assistant_web/releases/latest (25 MB) |
| Web | https://lobster.xo.je |
| Bot | https://t.me/Lobsterasistentbot |
| Autor | JACXAS |
| Licencia | MIT |

---

## 2. Descripciones por longitud

### 2.1 Una línea (≤ 100 caracteres)
> El asistente de IA que corre en tu PC: chat, agente con 23 herramientas y bot de Telegram.

### 2.2 Tagline para tienda / Product Hunt (≤ 60)
> Tu asistente de IA, en tu PC y con tus permisos.

### 2.3 Descripción corta (≈ 200 caracteres)
> Lobster es un asistente de IA para Windows que vive en tu computadora: chatea, ejecuta tareas con 23 herramientas, mira tu pantalla y también responde por Telegram. Elegís cerebro: nube gratuita o modelo local sin internet.

### 2.4 Descripción media (≈ 500 caracteres)
> Lobster corre en tu PC, no en la nube de otro. Chatea con memoria, pide tareas y las ejecuta con 23 herramientas (archivos, comandos permitidos, búsqueda web, capturas, navegador). Usa una API gratuita como Gemini o un modelo local incluido (llama.cpp) para trabajar sin internet. Todo pasa por un motor de permisos por riesgo que bloquea acciones destructivas y secretos. Además responde por Telegram con la misma memoria. Sin tarjeta, sin telemetría.

### 2.5 Descripción larga (≈ 1.200 caracteres)
> **Lobster es un asistente de IA que vive en tu computadora.**
>
> La mayoría de los asistentes te piden que subas tus archivos a su nube y te cobran por token. Lobster hace lo contrario: el panel, la memoria y las herramientas corren en tu máquina. Vos elegís el cerebro —una API gratuita como Gemini, o un modelo local que no necesita internet— y el asistente hace el resto.
>
> **Qué puede hacer:** conversar con memoria por sesión; leer y escribir archivos; ejecutar comandos de una lista blanca; buscar en la web sin API key; abrir páginas y operar el navegador; sacar capturas y describir tu pantalla; guardar notas; y responder por Telegram con las mismas herramientas.
>
> **Con frenos:** cada herramienta tiene un nivel de riesgo (bajo, medio, alto, crítico) y el motor de permisos decide si se permite, se pide confirmación o se bloquea. Detecta secretos, bloquea comandos destructivos y los clics físicos están desactivados por defecto (muestra dónde irían).
>
> **Sin sorpresas:** la base de datos es un archivo SQLite en tu disco. No hay telemetría. El modo local no manda nada a ningún lado; el modo nube solo envía el texto del chat (y la captura, si usás visión) al proveedor que configures con tu propia clave.
>
> **Requisitos:** Windows 10/11, Node.js 20 o superior y ~2 GB de disco. Instalación en dos dobles clics.

---

## 3. Características (bullets para ficha)

- **Chat con memoria** por sesión, guardado en SQLite local; streaming token a token con botón Detener.
- **Agente con 23 herramientas**: archivos, comandos permitidos, búsqueda web, URLs, estado del sistema, capturas, portapapeles, notas, búsqueda de archivos, abrir apps y navegador controlado por DOM.
- **Dos cerebros intercambiables desde el chat**: nube gratuita (Gemini, Groq, Cerebras, OpenRouter) o motor local `llama-server` (llama.cpp) incluido, sin Ollama ni servicios de terceros.
- **Modelos con descarga bajo demanda**: 379 MB (Qwen 2.5 0.5B) a 1,8 GB (Qwen 2.5 3B), reanudable y verificado.
- **Visión de pantalla** sin GPU: describe qué hay, dónde está un botón o qué error apareció.
- **Permisos por riesgo** (bajo/medio/alto/crítico → permitir/confirmar/bloquear), anti-secretos y anti-destructivos.
- **Bot de Telegram** opcional con la misma persona, memoria y herramientas.
- **Privacidad por diseño**: sin telemetría; todo local salvo lo que decidas enviar al cerebro.
- **Un solo proceso**: panel + API en `localhost:3000`, sin dependencias en la nube para funcionar.

---

## 4. Para quién es

**Le sirve a:**
- Quien quiere automatizar tareas de su PC sin subir archivos a un servicio.
- Quien tiene hardware modesto y prefiere que el trabajo pesado lo haga una API gratuita.
- Quien quiere su asistente también en Telegram, con la misma memoria.
- Quien desconfía de los agentes que tocan la máquina sin frenos: acá todo pasa por permisos.

**No le sirve a:**
- Quien busca cero configuración (hoy hace falta instalar Node y ejecutar un `.bat`).
- Quien espera un modelo local rápido en una PC de 2011 (ver límites).
- Quien usa Linux o macOS (v1 es solo Windows).

---

## 5. Diferenciación (comparativa honesta)

| | Lobster | Asistentes cloud típicos | Agentes "de escritorio" |
|---|---|---|---|
| Dónde corre | Tu PC | Su nube | Tu PC |
| Costo por token | No paga el proyecto (nube gratis o local) | Suscripción o por uso | Variable |
| Funciona sin internet | Sí, con motor local | No | Depende |
| Memoria | SQLite en tu disco | En su servidor | Variable |
| Permisos | Riesgo → permitir/confirmar/bloquear | N/A | Suele ser todo o nada |
| Telegram | Incluido, misma memoria | Bot aparte | Raro |

---

## 6. Precios (texto para la web o el pitch)

- **Eco — gratis.** Chat + agente con 23 herramientas, bot de Telegram, cerebro local o tu clave gratuita. Para probar y para PCs viejas.
- **Estándar — u$s 9/mes.** Pensado para uso diario: cerebro en la nube gestionado (sin pegar claves), cuota de visión y soporte.
- **Pro — u$s 29/mes.** Para equipos: visión y clics con confirmación, multi-PC, API local para tus propias herramientas e instalador con tu marca.

> **Transparencia:** el cobro todavía no está habilitado. Durante el acceso anticipado los planes pagos se coordinan por Telegram y el plan Eco es gratis de verdad.

---

## 7. Requisitos y límites (lo que hay que decir siempre)

- Windows 10/11 de 64 bits · Node.js 20+ · ~2 GB libres (dependencias) + espacio para modelos.
- **Modo local en hardware viejo es lento**: medido en una AMD E-350 de 2011 (2 núcleos, 3,5 GB): ~0,2 tokens/s, entre 1 y 3 minutos por respuesta. Sirve para frases cortas y para trabajar sin internet; para conversar, la nube gratuita es ~100× más rápida.
- El instalador es un `.bat`; todavía no hay instalador autocontenido (requiere Node).
- Sin clics físicos por defecto: los clics muestran una vista previa hasta que los habilites.

---

## 8. Textos listos para publicar

### GitHub — "About" (160 caracteres)
> Asistente de IA para Windows que corre en tu PC: chat con memoria, agente de 23 herramientas y bot de Telegram. Cerebro en la nube gratis o local (llama.cpp).

### GitHub — topics
`ai-assistant` `local-first` `llama-cpp` `windows` `telegram-bot` `agent` `privacy` `typescript` `sqlite` `self-hosted`

### Product Hunt — tagline + primeros 260 caracteres
> **Tu asistente de IA, en tu PC y con tus permisos.**
> Lobster corre en tu computadora: chatea, ejecuta tareas con 23 herramientas, mira tu pantalla y responde por Telegram. Elegís cerebro: nube gratuita o modelo local sin internet. Sin telemetría, con permisos por riesgo y descarga de 25 MB.

### Reddit / Hacker News (título + cuerpo)
> **Lobster: un asistente de IA que corre en tu PC y no paga tokens**
>
> Lo armé porque quería un asistente que pudiera tocar mis archivos sin subirlos a ninguna parte, y que no me cobrara por token. Usa una API gratuita (Gemini) o un modelo local con llama.cpp incluido. Tiene 23 herramientas, permisos por riesgo (bloquea secretos y comandos destructivos), memoria en SQLite y bot de Telegram.
>
> Lo probé en una AMD E-350 de 2011: la nube va bien, el modo local tarda 1-3 minutos por respuesta (lo digo en la landing, no lo escondo). Windows, MIT, 25 MB: [link]

### WhatsApp / Telegram (pitch de 3 líneas)
> 🦞 Te paso Lobster: un asistente de IA que corre en tu PC.
> Chatea, mueve archivos, busca en la web y también te contesta por Telegram.
> Gratis, 25 MB, Windows: https://github.com/jacxas/lobster_assistant_web/releases/latest

### Ficha de tienda — campo "descripción corta"
> Asistente de IA local para Windows con agente de 23 herramientas, visión de pantalla y bot de Telegram. Nube gratuita o modelo local sin internet.

---

## 9. Preguntas frecuentes (para web o respuestas)

**¿Se sube algo a la nube?**
Solo lo que decidas. Con cerebro local, nada sale de tu PC. Con nube van el texto del chat y, si usás visión, la captura.

**¿Funciona sin internet?**
Sí, con el motor local incluido: descargás un modelo una vez y anda offline. En PCs viejas es lento (1-3 min por respuesta).

**¿Puede romper mi PC?**
No debería: los comandos van por lista blanca, los clics están en vista previa y el motor de permisos bloquea acciones destructivas y secretos. Aun así, es software: probalo primero en una carpeta de prueba.

**¿Necesito una API key?**
No. Sin clave usa el motor local. Con una clave gratuita de Google AI Studio anda mucho más rápido.

**¿Hay versión para Linux o Mac?**
Todavía no. v1 es Windows.

**¿Qué pasa con mis conversaciones?**
Quedan en un archivo SQLite en tu disco (`apps\.data\lobster.db`). Podés borrarlas desde el panel.

---

## 10. Notas legales y de marca

- Licencia MIT. Se puede usar, modificar y redistribuir manteniendo el aviso.
- No está afiliado a Google, Meta, Telegram ni a los proveedores de modelos mencionados.
- Las marcas de terceros (Gemini, Telegram, Windows, Llama, Qwen) pertenecen a sus dueños y se nombran solo para indicar compatibilidad.
- Si se redistribuye con marca propia, revisar la licencia de llama.cpp (MIT) incluida en `apps/engine`.
