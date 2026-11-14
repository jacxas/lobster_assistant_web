import { Hero } from "./Hero";
import { KpiRow } from "./KpiRow";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";
import { SecurityOverview } from "./SecurityOverview";
import { useDashboardData } from "./useDashboardData";

interface DashboardProps {
  onNavigate: (id: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { stats, error } = useDashboardData();

  return (
    <div className="space-y-5">
      <Hero onOpenChat={() => onNavigate("assistant")} />

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs text-red-300">
          No pude leer las métricas ({error}) — reintento automático cada 20 s.
        </p>
      )}

      <KpiRow stats={stats} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <QuickActions onNavigate={onNavigate} />
        <RecentActivity stats={stats} />
      </div>

      <SecurityOverview stats={stats} />
    </div>
  );
}
