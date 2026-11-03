import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, MessageSquare, Send, Sparkles } from "lucide-react";

type ChatTurn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What can you help me with?",
  "Summarize my local setup",
  "Draft a short status update",
];

export default function AssistantChat() {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, error]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const next: ChatTurn[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, stream: false, history: messages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `The assistant could not reply (${res.status}).`);
      setMessages((prev) => [...prev, { role: "assistant", content: String(data.reply) }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant could not reply.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl">
      <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="rounded-xl bg-orange-400/10 p-2.5 text-orange-300"><MessageSquare className="h-4 w-4" /></div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Lobster Assistant</h2>
          <p className="text-[11px] text-white/40">Local · Ollama · private</p>
        </div>
        <span className={`ml-auto flex items-center gap-1.5 text-[11px] ${sending ? "text-orange-300" : "text-emerald-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sending ? "bg-orange-400" : "bg-emerald-400"}`} />
          {sending ? "Thinking" : "Ready"}
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" style={{ maxHeight: "58vh" }}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="rounded-2xl bg-orange-400/10 p-4 text-orange-300"><Sparkles className="h-6 w-6" /></div>
            <div>
              <p className="text-base font-semibold text-white">Ask your private assistant</p>
              <p className="mt-1 text-sm text-white/45">Runs on the local Ollama runtime — nothing leaves this machine.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/60 transition hover:border-orange-400/30 hover:text-white">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-orange-500 text-white" : "border border-white/10 bg-black/25 text-white/85"}`}>
              {message.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin text-orange-300" /> Lobster is thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-white/10 bg-black/20 px-4 py-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder="Message your assistant…"
          aria-label="Message your assistant"
          className="max-h-32 min-h-[44px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/40"
        />
        <button type="submit" disabled={!input.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}
