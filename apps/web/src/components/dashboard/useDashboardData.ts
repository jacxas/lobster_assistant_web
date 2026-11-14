import { useCallback, useEffect, useState } from "react";

// El API corre en :3000 y Vite en :5173 sin proxy, igual que en AssistantChat.
const API_BASE = "http://localhost:3000";

export interface DashboardStats {
  messages: { total: number; today: number };
  sessions: { total: number };
  recent: { role: "user" | "assistant" | "system"; content: string; created_at: number; platform: string }[];
  agent: {
    allowClicks: boolean;
    visionModel: string;
    model: string;
    cloud: boolean;
    maxSteps: number;
    tools: number;
  };
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats((await res.json()) as DashboardStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "sin conexión con el API");
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = window.setInterval(() => void reload(), 20_000);
    return () => window.clearInterval(id);
  }, [reload]);

  return { stats, error, reload };
}

export const shortModel = (id: string): string => {
  const clean = id.replace(/:free$/, "");
  const last = clean.split("/").pop() ?? clean;
  return last.replace(/-(\d)/, " $1").slice(0, 28);
};
