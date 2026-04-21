import Sparkline from "./Sparkline";
import { cn } from "@/lib/cn";

type StatCardProps = {
  label: string;
  value: number | string;
  sparkline?: number[];
  accent?: "default" | "emerald";
  loading?: boolean;
};

export default function StatCard({
  label,
  value,
  sparkline,
  accent = "default",
  loading,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      {loading ? (
        <>
          <div className="mt-3 h-8 w-20 animate-pulse rounded bg-zinc-100" />
          <div className="mt-3 h-7 w-full animate-pulse rounded bg-zinc-100" />
        </>
      ) : (
        <>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold tracking-tight tabular-nums",
              accent === "emerald" ? "text-emerald-600" : "text-zinc-900",
            )}
          >
            {value}
          </div>
          {sparkline && sparkline.length > 0 && (
            <div
              className={cn(
                "mt-3",
                accent === "emerald" ? "text-emerald-500" : "text-zinc-800",
              )}
            >
              <Sparkline values={sparkline} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
