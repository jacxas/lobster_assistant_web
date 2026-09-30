import { useEffect, useMemo, useState, type ReactNode } from "react";
import { chat, getStatus, type RuntimeStatus } from "@/lib/api";
import {
  Activity, Bot, ChevronRight, FolderOpen, Gauge, LayoutDashboard,
  MessageSquare, MoreHorizontal, Network, Search, Settings, Terminal, Wifi, Zap
} from "lucide-react";

type AppId = "home" | "assistant" | "models" | "channels" | "files" | "system" | "setup" | "settings";

const nav = [
  { id: "home" as AppId, label: "Overview", icon: LayoutDashboard },
  { id: "assistant" as AppId, label: "Assistant", icon: MessageSquare },
  { id: "models" as AppId, label: "Models", icon: Bot },
  { id: "channels" as AppId, label: "Channels", icon: Network },
  { id: "files" as AppId, label: "Files", icon: FolderOpen },
  { id: "system" as AppId, label: "System", icon: Gauge },
];

const apps: Record<AppId, { title: string; icon: typeof Bot }> = {
  home: { title: "Overview", icon: LayoutDashboard },
  assistant: { title: "Lobster Assistant", icon: MessageSquare },
  models: { title: "Models", icon: Bot },
  channels: { title: "Channels", icon: Network },
  files: { title: "Files", icon: FolderOpen },
  system: { title: "System Monitor", icon: Gauge },
  setup: { title: "Setup Wizard", icon: Zap },
  settings: { title: "Settings", icon: Settings },
};

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}>
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
      <h2 className="text-sm font-semibold tracking-wide text-white">{title}</h2>
      <MoreHorizontal className="h-4 w-4 text-white/35" />
    </div>
    <div className="p-5">{children}</div>
  </section>;
}

function RuntimeBadge({ runtime, error }: { runtime: RuntimeStatus | null; error: string }) {
  const online = runtime?.status === "ok" && runtime.services.ollama.ok;
  return <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
    {online ? "Runtime online" : error ? "Runtime unavailable" : "Runtime degraded"}
  </div>;
}

function Overview({ open, runtime, error }: { open: (id: AppId) => void; runtime: RuntimeStatus | null; error: string }) {
  const online = runtime?.status === "ok" && runtime.services.ollama.ok;
  const models = runtime?.services.ollama.models ?? [];

  return <div className="space-y-5">
    <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/15 via-white/[0.04] to-transparent p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3"><RuntimeBadge runtime={runtime} error={error} /></div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Lobster OS</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">The desktop surface for your Lobster runtime. This dashboard now reads its service state from the real server.</p>
        </div>
        <button onClick={() => open("assistant")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
          <MessageSquare className="h-4 w-4" /> Open Assistant
        </button>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Runtime", online ? "Online" : "Offline", "GET /api/status", online ? "text-emerald-400" : "text-red-300"],
        ["Ollama", runtime?.services.ollama.ok ? "Connected" : "Unavailable", runtime?.services.ollama.url ?? "Not reachable", runtime?.services.ollama.ok ? "text-emerald-400" : "text-red-300"],
        ["Models", String(models.length), models.length ? models.join(", ") : "No models reported", "text-orange-300"],
        ["Server", runtime?.version ?? "Unknown", runtime ? new Date(runtime.timestamp).toLocaleTimeString() : "No response", "text-sky-300"],
      ].map(([label, value, meta, color]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <p className="text-xs text-white/40">{label}</p><p className={`mt-2 text-xl font-semibold ${color}`}>{value}</p><p className="mt-1 truncate text-xs text-white/35">{meta}</p>
      </div>)}
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <Panel title="Workspace">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Assistant", "Send messages through /api/chat", "assistant", MessageSquare],
            ["Models", "Inspect models reported by Ollama", "models", Bot],
            ["Channels", "Integration configuration surface", "channels", Network],
            ["Files", "Workspace and runtime data", "files", FolderOpen],
          ].map(([title, desc, id, Icon]) => <button key={id} onClick={() => open(id as AppId)} className="group flex items-center gap-4 rounded-xl border border-white/8 bg-black/10 p-4 text-left transition hover:border-orange-400/30 hover:bg-orange-400/5">
            <div className="rounded-xl bg-white/7 p-3 text-white/60 group-hover:text-orange-300"><Icon className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 truncate text-xs text-white/35">{desc}</p></div>
            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50" />
          </button>)}
        </div>
      </Panel>
      <Panel title="Runtime health">
        <div className="space-y-4">
          {[["API", runtime ? "Responding" : "No response", runtime ? "100%" : "0%"], ["Ollama", runtime?.services.ollama.ok ? "Connected" : "Unavailable", runtime?.services.ollama.ok ? "100%" : "0%"], ["Models", `${models.length} discovered`, models.length ? "100%" : "0%"]].map(([name, value, width]) => <div key={name}>
            <div className="mb-1.5 flex justify-between text-xs"><span className="text-white/55">{name}</span><span className="text-white/75">{value}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-orange-400" style={{ width }} /></div>
          </div>)}
          {error && <p className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>}
        </div>
      </Panel>
    </div>

    <Panel title="Recent activity">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2.5">
        <Activity className={`h-4 w-4 ${online ? "text-emerald-400/70" : "text-red-400/70"}`} />
        <span className="text-sm text-white/55">{online ? "Ollama runtime detected by API" : "Runtime status could not be confirmed"}</span>
        <span className="ml-auto text-[10px] text-white/25">{runtime ? new Date(runtime.timestamp).toLocaleTimeString() : "—"}</span>
      </div>
    </Panel>
  </div>;
}

function AssistantPanel() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true); setError(""); setMessage("");
    try { setReply((await chat(text)).reply); }
    catch (err) { setError(err instanceof Error ? err.message : "Assistant unavailable"); }
    finally { setBusy(false); }
  }

  return <Panel title="Private conversations">
    <div className="flex min-h-[420px] flex-col">
      <div className="flex-1 rounded-xl border border-white/7 bg-black/15 p-5">
        {reply ? <div><p className="mb-2 text-[10px] uppercase tracking-[.18em] text-orange-300/70">Lobster</p><p className="whitespace-pre-wrap text-sm leading-7 text-white/75">{reply}</p></div>
          : <div className="flex h-full min-h-[300px] items-center justify-center text-center"><div><div className="mb-3 text-4xl">🦞</div><p className="text-sm text-white/60">Lobster is ready.</p><p className="mt-1 text-xs text-white/30">Messages are sent to the real /api/chat endpoint.</p></div></div>}
      </div>
      {error && <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>}
      <div className="mt-4 flex gap-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} placeholder={busy ? "Lobster is thinking..." : "Ask Lobster anything..."} disabled={busy} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/40 disabled:opacity-50" />
        <button onClick={() => void send()} disabled={busy || !message.trim()} className="rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">{busy ? "..." : "Send"}</button>
      </div>
    </div>
  </Panel>;
}

function AppPanel({ id, runtime }: { id: AppId; runtime: RuntimeStatus | null }) {
  const models = runtime?.services.ollama.models ?? [];
  const configs: Record<AppId, { icon: typeof Bot; heading: string; description: string; items: string[] }> = {
    assistant: { icon: MessageSquare, heading: "Private conversations", description: "Connected to the real Lobster chat endpoint.", items: ["POST /api/chat", "Session-backed history", "Local Ollama provider"] },
    models: { icon: Bot, heading: "Local models", description: "Models reported by the live Ollama status endpoint.", items: models.length ? models.map((m) => `${m} · reported by Ollama`) : ["No models reported"] },
    channels: { icon: Network, heading: "Connected channels", description: "Integration configuration surface; channel runtime APIs are not exposed by /api/status yet.", items: ["Telegram · configuration", "Discord · configuration", "WhatsApp · configuration"] },
    files: { icon: FolderOpen, heading: "Workspace files", description: "File management surface; no file API is exposed by the current runtime yet.", items: ["Workspace", "Runtime data", "Logs"] },
    system: { icon: Gauge, heading: "Runtime telemetry", description: "Live service information from /api/status.", items: [`API · ${runtime ? "responding" : "unavailable"}`, `Ollama · ${runtime?.services.ollama.ok ? "connected" : "unavailable"}`, `Models · ${models.length} discovered`, `Version · ${runtime?.version ?? "unknown"}`] },
    setup: { icon: Zap, heading: "Setup wizard", description: "Runtime configuration surface.", items: ["Configure API URL", "Configure Ollama", "Select model", "Connect channels"] },
    settings: { icon: Settings, heading: "Settings", description: "Control runtime and client configuration.", items: ["API endpoint", "AI provider", "Privacy", "Advanced"] },
    home: { icon: LayoutDashboard, heading: "Overview", description: "", items: [] },
  };
  const C = configs[id]; const Icon = C.icon;
  return <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
    <Panel title={C.heading}>
      <div className="flex items-start gap-4 rounded-xl border border-orange-400/15 bg-orange-400/5 p-5"><div className="rounded-xl bg-orange-400/10 p-3 text-orange-300"><Icon className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-white">{C.heading}</h2><p className="mt-1 text-sm leading-6 text-white/45">{C.description}</p></div></div>
      <div className="mt-4 space-y-2">{C.items.map((item, i) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/7 bg-black/10 p-4"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/7 text-[10px] text-white/40">{i + 1}</span><span className="text-sm text-white/65">{item}</span></div>)}</div>
    </Panel>
    <Panel title="Runtime"><div className="space-y-3">
      {[["Status", runtime?.status ?? "unavailable"], ["Provider", runtime?.services.ollama.ok ? "Ollama" : "Unavailable"], ["Models", String(models.length)], ["Version", runtime?.version ?? "unknown"]].map(([a,b]) => <div key={a} className="flex justify-between border-b border-white/7 py-3 text-sm last:border-0"><span className="text-white/35">{a}</span><span className="text-white/70">{b}</span></div>)}
    </div></Panel>
  </div>;
}

export default function DesktopShell() {
  const [active, setActive] = useState<AppId>("home");
  const [search, setSearch] = useState("");
  const [showCommand, setShowCommand] = useState(false);
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try { const data = await getStatus(); if (!cancelled) { setRuntime(data); setStatusError(""); } }
      catch (err) { if (!cancelled) { setRuntime(null); setStatusError(err instanceof Error ? err.message : "Status unavailable"); } }
    }
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const visibleNav = useMemo(() => nav.filter((n) => n.label.toLowerCase().includes(search.toLowerCase())), [search]);
  const ActiveIcon = apps[active].icon;
  const open = (id: AppId) => { setActive(id); setShowCommand(false); };

  return <div className="min-h-screen overflow-hidden bg-[#09090b] text-white">
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0d0d10]/95 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-600 text-lg shadow-lg shadow-orange-950/40">🦞</div><span className="text-sm font-semibold tracking-wide">Lobster OS</span><span className="rounded-md border border-white/8 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/30">runtime</span></div>
        <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-1.5 md:flex"><Search className="h-3.5 w-3.5 text-white/25" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search apps..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25" /></div>
        <div className="flex items-center gap-2"><button onClick={() => setShowCommand(true)} className="rounded-lg border border-white/8 bg-white/5 p-2 text-white/45 hover:text-white"><Terminal className="h-4 w-4" /></button><button onClick={() => open("settings")} className="rounded-lg border border-white/8 bg-white/5 p-2 text-white/45 hover:text-white"><Settings className="h-4 w-4" /></button></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-[#0b0b0e] p-3 md:block">
          <div className="mb-4 px-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/25">Workspace</div>
          <nav className="space-y-1">{visibleNav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => open(id)} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active === id ? "bg-orange-500/10 text-orange-300" : "text-white/45 hover:bg-white/5 hover:text-white/80"}`}><Icon className="h-4 w-4" /><span>{label}</span>{active === id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-400" />}</button>)}</nav>
          <div className="mt-6 border-t border-white/7 pt-4"><button onClick={() => open("setup")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 hover:bg-white/5 hover:text-white"><Zap className="h-4 w-4" /> Setup Wizard</button><button onClick={() => open("settings")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 hover:bg-white/5 hover:text-white"><Settings className="h-4 w-4" /> Settings</button></div>
          <div className="mt-8 rounded-xl border border-white/7 bg-white/[0.03] p-3"><div className="flex items-center gap-2"><Wifi className={`h-3.5 w-3.5 ${runtime?.status === "ok" ? "text-emerald-400" : "text-red-400"}`} /><span className="text-xs text-white/45">{runtime?.status === "ok" ? "Runtime online" : "Runtime offline"}</span><span className={`ml-auto h-1.5 w-1.5 rounded-full ${runtime?.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} /></div></div>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_70%_10%,rgba(249,115,22,.07),transparent_30%),linear-gradient(180deg,#0d0d10_0%,#09090b_100%)]">
          <div className="mx-auto max-w-[1400px] p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-lg border border-white/8 bg-white/5 p-2 text-orange-300"><ActiveIcon className="h-4 w-4" /></div><div><p className="text-[10px] uppercase tracking-[.2em] text-white/25">Lobster Workspace</p><h1 className="text-lg font-semibold text-white">{apps[active].title}</h1></div></div>
            {active === "home" ? <Overview open={open} runtime={runtime} error={statusError} /> : active === "assistant" ? <AssistantPanel /> : <AppPanel id={active} runtime={runtime} />}
          </div>
        </main>
      </div>
      <footer className="flex h-9 shrink-0 items-center gap-4 border-t border-white/10 bg-[#0d0d10] px-4 text-[10px] text-white/30"><span className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${runtime?.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} /> {runtime?.status === "ok" ? "Online" : "Offline"}</span><span>Ollama {runtime?.services.ollama.ok ? "connected" : "unavailable"}</span><span>{runtime?.services.ollama.models.length ?? 0} models</span><span className="ml-auto">Lobster OS · runtime</span></footer>
    </div>
    {showCommand && <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 pt-[12vh] backdrop-blur-sm" onClick={() => setShowCommand(false)}><div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#151519] p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-2 border-b border-white/8 px-3 pb-3"><Search className="h-4 w-4 text-white/30" /><span className="text-sm text-white/40">Command palette</span></div><div className="space-y-1 pt-2">{Object.entries(apps).filter(([id]) => id !== "home").map(([id, item]) => <button key={id} onClick={() => open(id as AppId)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white"><item.icon className="h-4 w-4" />{item.title}<span className="ml-auto text-[10px] text-white/20">Open</span></button>)}</div></div></div>}
  </div>;
}
