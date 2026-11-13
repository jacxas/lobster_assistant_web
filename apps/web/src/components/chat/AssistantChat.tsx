import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, Bot, Loader2, SendHorizontal, Square, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// El API corre en :3000 y Vite en :5173 sin proxy de /api, así que las llamadas van
// cross-origin; el server ya permite el origen http://localhost:5173 con credentials.
const API_BASE = "http://localhost:3000";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

const formatElapsed = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function EmptyState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4 text-orange-300">
        <Bot className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/70">Tu asistente local</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-white/35">
          Escribe un mensaje para conversar con el modelo cargado en esta máquina. Nada sale de tu PC.
        </p>
      </div>
    </div>
  );
}

export default function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [agentMode, setAgentMode] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const nextId = () => `msg-${++idRef.current}`;

  // Segundos transcurridos mientras hay streaming.
  useEffect(() => {
    if (!streaming) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [streaming]);

  // Auto-scroll al fondo con cada mensaje/chunk.
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>("[data-slot='scroll-area-viewport']");
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, streaming]);

  // Al desmontar la ventana, abortar cualquier stream en curso.
  useEffect(() => () => abortRef.current?.abort(), []);

  const appendToMessage = (id: string, text: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: m.content + text } : m)));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: ChatMessage = { id: nextId(), role: "user", content: text };
    const assistantId = nextId();

    setInput("");
    setError(null);
    setElapsed(0);
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setStreaming(true);
    setStreamingId(assistantId);

    // Procesa un bloque SSE; devuelve true cuando hay que terminar la lectura (done / error).
    const processEvent = (block: string): boolean => {
      let event = "";
      const dataLines: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice("event:".length).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).replace(/^ /, ""));
      }
      const data = dataLines.join("\n");

      if (event === "chunk") {
        try {
          const chunk = JSON.parse(data) as { text?: unknown };
          const chunkText = chunk.text;
          if (typeof chunkText === "string" && chunkText.length > 0) appendToMessage(assistantId, chunkText);
        } catch {
          // Chunk con JSON inválido: se ignora y el stream continúa.
        }
        return false;
      }
      if (event === "done") return true;
      if (event === "error") {
        let message = "El asistente reportó un error";
        try {
          const parsed = JSON.parse(data) as { message?: unknown };
          if (typeof parsed.message === "string" && parsed.message) message = parsed.message;
        } catch {
          // data sin JSON: se usa el mensaje genérico.
        }
        setError(message);
        return true;
      }
      return false; // Evento desconocido: continuar.
    };

    try {
      const res = await fetch(agentMode ? `${API_BASE}/api/agent` : `${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(agentMode ? { task: text, stream: true } : { message: text, stream: true }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`El servidor respondió con estado ${res.status}`);
      if (!res.body) throw new Error("La respuesta no incluye stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Cada evento SSE termina con una línea en blanco (\n\n).
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const block of parts) {
          if (block.trim() === "") continue;
          if (processEvent(block)) {
            finished = true;
            break;
          }
        }
        if (finished) break;
      }

      if (!finished) {
        // El server cerró la conexión sin \n\n final: vaciar el buffer restante.
        buffer += decoder.decode();
        if (buffer.trim() !== "") processEvent(buffer);
      }
      try {
        await reader.cancel();
      } catch {
        // El stream ya estaba cerrado.
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // El usuario presionó detener: se conserva el texto parcial recibido.
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("No se pudo contactar al asistente local");
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setStreamingId(null);
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const handleClearHistory = async () => {
    if (streaming || clearing) return;
    setClearing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/chat/history`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(`El servidor respondió con estado ${res.status}`);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "No se pudo borrar el historial");
    } finally {
      setClearing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-13.5rem)] min-h-[540px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-400/10 p-2 text-orange-300">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white">Lobster Assistant</h2>
            <p className="text-[11px] text-white/35">tinyllama · local · privado</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAgentMode((v) => !v)}
          disabled={streaming || clearing}
          title="Alternar modo agente (permite que use herramientas del PC)"
          className={cn(
            "rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40",
            agentMode && "border-orange-400/40 bg-orange-400/10 text-orange-300"
          )}
        >
          <Bot className="h-3.5 w-3.5" /> Agente {agentMode ? "ON" : "OFF"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleClearHistory()}
          disabled={streaming || clearing}
          title="Borrar historial"
          className="rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" /> Borrar historial
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="mx-auto w-full max-w-3xl space-y-4 p-5" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn("flex w-full gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-orange-300">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-6",
                      m.role === "user"
                        ? "rounded-br-md bg-orange-500 text-white shadow-lg shadow-orange-950/30"
                        : "rounded-bl-md border border-white/10 bg-white/[0.06] text-white/90"
                    )}
                  >
                    {m.content}
                    {m.role === "assistant" && streaming && m.id === streamingId && (
                      <span className="ml-1 inline-block h-3.5 w-[2px] animate-pulse rounded-full bg-orange-400 align-middle" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {error && (
        <div className="mx-5 mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-300/60 transition hover:text-red-200" title="Descartar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="shrink-0 border-t border-white/10 p-4">
        {streaming && (
          <div className="mb-2 flex items-center gap-2 px-1 text-[11px] text-white/40">
            <Loader2 className="h-3 w-3 animate-spin text-orange-300" />
            Generando respuesta…
            <span className="font-mono text-orange-300/80">{formatElapsed(elapsed)}</span>
          </div>
        )}
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder={streaming ? "Esperando respuesta…" : agentMode ? "Tarea para el agente (puede usar herramientas del PC)…" : "Escribe un mensaje…"}
            className="h-11 flex-1 rounded-xl border-white/10 bg-black/20 text-sm text-white placeholder:text-white/25 focus-visible:border-orange-400/40 focus-visible:ring-orange-400/20"
          />
          {streaming ? (
            <Button
              type="button"
              size="icon"
              onClick={handleStop}
              title="Detener"
              className="h-11 w-11 shrink-0 rounded-xl border border-red-400/25 bg-red-400/10 text-red-300 hover:bg-red-400/20 hover:text-red-200"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={() => void handleSend()}
              disabled={!input.trim()}
              title="Enviar"
              className="h-11 w-11 shrink-0 rounded-xl bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mx-auto mt-2 w-full max-w-3xl px-1 text-[10px] leading-4 text-white/30">
          En esta PC las respuestas pueden tardar varios minutos (CPU antigua)
        </p>
      </div>
    </div>
  );
}
