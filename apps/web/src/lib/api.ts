const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\\/$/, "");

export async function chat(message: string, model?: string) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, model, stream: false, platform: "web" }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<{ reply: string; platform: string }>;
}

export async function getStatus() {
  const response = await fetch(`${API_BASE}/api/status`, { credentials: "include" });
  if (!response.ok) throw new Error(`Status request failed (${response.status})`);
  return response.json() as Promise<{
    ok: boolean;
    services?: { ollama?: { ok: boolean; models?: string[] } };
  }>;
}
