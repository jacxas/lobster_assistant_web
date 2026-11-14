import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  Cloud,
  Cpu,
  Eye,
  Gauge,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TRANSCRIPT = `> "lista mi carpeta Descargas y decime cuántos archivos hay"

🔧 list_files {"path":"C:/Users/vos/Downloads"}
↳ 64 entradas (61 archivos + 3 carpetas)…

✅ "Hay 61 archivos y 3 carpetas. Ejemplos: 061025TPG.rar,
   360TS_Setup.exe, 2ZOEAAQG…avif"`;

const FACTS = [
  {
    title: "Privacidad por diseño",
    body: "Todo corre en tu equipo. Solo el texto que escribís —o la captura, si usás visión— viaja al cerebro que vos elijas.",
    icon: Lock,
  },
  {
    title: "Permisos con frenos",
    body: "12 comandos en allowlist, clics en vista previa por defecto y aborto real cuando cortás la generación.",
    icon: ShieldCheck,
  },
  {
    title: "Corre en hardware modesto",
    body: "Probado en una PC de 2011 con 3.5 GB de RAM. El cerebro pesado puede vivir en la nube; las manos, en tu máquina.",
    icon: Gauge,
  },
];

const FEATURES = [
  {
    title: "Chat con memoria",
    body: "Conversaciones guardadas en SQLite, por sesión y por canal. Streaming token a token con botón Detener.",
    icon: MessageSquare,
  },
  {
    title: "Agente con 10 herramientas",
    body: "Archivos, comandos permitidos, URLs, estado del sistema, captura de pantalla y clics. Ciclo percibir → actuar → verificar.",
    icon: Brain,
  },
  {
    title: "Visión de pantalla",
    body: "Mira tu escritorio y responde qué hay, dónde está un botón o qué error apareció. Sin GPU.",
    icon: Eye,
  },
  {
    title: "Bot en tu mensajería",
    body: "Telegram hoy; WhatsApp, Discord y Slack con la misma sesión y memoria. Modo cangrejo incluido. 🦀",
    icon: Send,
  },
];

const STEPS = [
  {
    title: "Instalás Lobster",
    body: "Un instalador liviano trae el runtime, el panel y el bot. Doble clic y arranca.",
    icon: Zap,
  },
  {
    title: "Elegís el cerebro",
    body: "Local con Ollama (privado, gratis) o una API compatible con OpenAI usando tu propia clave (BYOK).",
    icon: Cpu,
  },
  {
    title: "Usás desde donde estés",
    body: "Panel web, Telegram o la API. Las mismas herramientas y la misma memoria en todos lados.",
    icon: Cloud,
  },
];

const PLANS = [
  {
    name: "Eco",
    price: "Gratis",
    tag: "BYOK",
    desc: "Para PCs viejas y curiosos.",
    features: [
      "Chat + agente con 10 herramientas",
      "Cerebro local (1–3B) o tu key gratis",
      "Visión incluida (tu proveedor)",
      "Bot de Telegram",
    ],
    cta: "Empezar gratis",
    highlight: false,
  },
  {
    name: "Estándar",
    price: "u$s 9",
    period: "/mes",
    tag: "Popular",
    desc: "Para uso diario sin fricción.",
    features: [
      "Todo lo de Eco",
      "Cerebro 7–8B incluido (sin API key)",
      "Cuota de visión mensual",
      "Sandbox + historial ilimitado",
      "Soporte prioritario",
    ],
    cta: "Probar 14 días",
    highlight: true,
  },
  {
    name: "Pro",
    price: "u$s 29",
    period: "/mes",
    tag: "Equipos",
    desc: "Automatización de escritorio de verdad.",
    features: [
      "Todo lo de Estándar",
      "Visión y clics con confirmación",
      "Multi-PC y perfiles de hardware",
      "API local + MCP para tus propias tools",
      "Instalador white-label",
    ],
    cta: "Hablar con ventas",
    highlight: false,
  },
];

const FAQ = [
  {
    q: "¿Se sube algo a la nube?",
    a: "Solo lo que decidas. Con cerebro local, nada sale de tu PC. Con cerebro en la nube van el texto del chat y, si usás visión, la captura de pantalla.",
  },
  {
    q: "¿Funciona sin internet?",
    a: "El chat y las herramientas locales sí. El agente con nube y el bot necesitan conexión.",
  },
  {
    q: "¿Qué hardware necesito?",
    a: "Menos del que imaginás: se probó en una AMD E-350 de 2011 con 3.5 GB de RAM. En equipos modernos vuela.",
  },
  {
    q: "¿Puede tocar mi PC sin permiso?",
    a: "No. Los comandos van por allowlist y los clics están en vista previa hasta que los habilites explícitamente.",
  },
  {
    q: "¿Puedo usar mi propia API key?",
    a: "Sí, BYOK de punta a punta: OpenRouter, OpenAI o cualquier endpoint compatible. La clave queda en tu equipo.",
  },
];

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300/80">{kicker}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      {sub && <p className="mt-3 text-sm leading-relaxed text-white/45">{sub}</p>}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0d]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-lg">🦞</span> Lobster
            <span className="ml-1 rounded-full border border-orange-400/25 bg-orange-400/10 px-2 py-0.5 text-[10px] font-medium text-orange-200">
              early access
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/50 md:flex">
            <a href="#producto" className="hover:text-white">Producto</a>
            <a href="#como" className="hover:text-white">Cómo funciona</a>
            <a href="#precios" className="hover:text-white">Precios</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <Link href="/">
            <Button size="sm" className="rounded-lg bg-orange-500 text-white hover:bg-orange-400">
              Abrir demo
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-24 px-4 pb-24 pt-14">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-1 text-xs text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Acceso anticipado · corre en tu propia PC
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              El asistente que vive en tu PC.{" "}
              <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                Con manos y ojos.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/45 sm:text-lg">
              Lee tus carpetas, ejecuta comandos permitidos, abre webs y mira tu pantalla — desde el chat, el panel o
              Telegram. Vos elegís el cerebro: local y privado, o una API con tu propia clave.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/">
                <Button size="lg" className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-400">
                  Probar ahora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/jacxas/lobster_assistant_web"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.05]"
              >
                Ver en GitHub
              </a>
            </div>
            <p className="mt-4 text-xs text-white/35">Sin tarjeta · BYOK · Windows hoy, Linux después.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0d12] shadow-2xl shadow-orange-500/[0.06]"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-xs">
              <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 font-mono text-emerald-300">AGENTE</span>
              <span className="truncate font-mono text-white/40">sesión real · 8 s</span>
              <span className="ml-auto flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/10" />
                <span className="h-2 w-2 rounded-full bg-white/10" />
                <span className="h-2 w-2 rounded-full bg-white/10" />
              </span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-4 font-mono text-[12px] leading-relaxed text-white/70">
              {TRANSCRIPT}
            </pre>
            <div className="border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-white/35">
              Cerebro: <span className="text-white/60">Nemotron 3 Ultra (cloud, gratis)</span> · Manos:{" "}
              <span className="text-white/60">tu PC</span> · Clics: <span className="text-amber-300">vista previa</span>
            </div>
          </motion.div>
        </section>

        {/* Garantías */}
        <section className="grid gap-4 md:grid-cols-3">
          {FACTS.map(({ title, body, icon: Icon }) => (
            <div key={title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
              <Icon className="h-5 w-5 text-orange-300" />
              <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{body}</p>
            </div>
          ))}
        </section>

        {/* Producto */}
        <section id="producto" className="space-y-8 scroll-mt-24">
          <SectionTitle
            kicker="Producto"
            title="Un cerebro, muchas manos"
            sub="Chat, agente, visión y bot comparten la misma memoria y las mismas herramientas — con permisos pensados para no romper nada."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ title, body, icon: Icon }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="h-fit rounded-lg bg-orange-400/10 p-2.5 text-orange-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/45">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como" className="space-y-8 scroll-mt-24">
          <SectionTitle kicker="Cómo funciona" title="Tres pasos y estás conversando" />
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ title, body, icon: Icon }, i) => (
              <div key={title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-white/5 p-2 text-orange-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-xs text-white/30">0{i + 1}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="space-y-8 scroll-mt-24">
          <SectionTitle
            kicker="Precios"
            title="Barato porque el cómputo es tuyo"
            sub="El costo marginal de cada usuario es cero: la IA corre en tu equipo. Los planes solo agregan cerebro en la nube, cuotas y comodidades."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.highlight
                    ? "border-orange-400/40 bg-gradient-to-b from-orange-500/[0.08] to-transparent shadow-2xl shadow-orange-500/[0.06]"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-orange-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {plan.tag}
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                  {!plan.highlight && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                      {plan.tag}
                    </span>
                  )}
                </div>
                <p className="mt-4">
                  <span className="text-3xl font-semibold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-white/35">{plan.period}</span>}
                </p>
                <p className="mt-1 text-xs text-white/35">{plan.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full rounded-xl ${
                    plan.highlight
                      ? "bg-orange-500 text-white hover:bg-orange-400"
                      : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  variant={plan.highlight ? "default" : "secondary"}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30">
            Precios de lanzamiento con IVA aparte. Los planes con nube incluyen una cuota mensual; el excedente se cobra
            por uso o se cubre con tu propia clave.
          </p>
        </section>

        {/* Privacidad técnica */}
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Privacidad</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Transparente hasta el detalle incómodo</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                El panel muestra qué está habilitado en todo momento: si los clics son reales o vista previa, qué modelo
                de visión está configurado y qué comandos están permitidos. Sin letra chica.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Ollama local", "OpenRouter BYOK", "SQLite en tu disco", "Sin telemetría", "MCP-ready"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-8 scroll-mt-24">
          <SectionTitle kicker="FAQ" title="Preguntas frecuentes" />
          <div className="grid gap-3 md:grid-cols-2">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <summary className="cursor-pointer list-none text-sm font-medium text-white/85 marker:hidden">
                  {q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/45">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden rounded-2xl border border-orange-400/25 bg-gradient-to-br from-orange-500/[0.14] via-white/[0.03] to-transparent p-8 text-center md:p-12">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <h2 className="relative text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Tu próxima tarea se hace sola. 🦞
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/45">
            Probalo en tu propia máquina en menos de un minuto. Si te gusta, el plan Eco es gratis para siempre.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/">
              <Button size="lg" className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-400">
                Abrir demo <Sparkles className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://t.me/Jacxasbot"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.05]"
            >
              <Bot className="mr-1.5 inline h-4 w-4" /> Probar el bot
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-white/30 sm:flex-row">
          <p>🦞 Lobster · asistente local con manos y ojos · Hecho con {""}
            <Terminal className="inline h-3 w-3" /> en LATAM
          </p>
          <p>© 2026 · early access · precios de lanzamiento</p>
        </div>
      </footer>
    </div>
  );
}
