import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RecutRow } from "@/lib/types";
import { lineAlerts } from "@/lib/aggregations";

interface ThresholdAlertsProps {
  rows: RecutRow[];
  threshold: number;
  onThresholdChange: (n: number) => void;
}

export function ThresholdAlerts({
  rows,
  threshold,
  onThresholdChange,
}: ThresholdAlertsProps) {
  const alerts = lineAlerts(rows, threshold);
  const active = threshold > 0;

  return (
    <div
      className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="threshold-alerts-card"
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              active && alerts.length > 0
                ? "bg-rose-100 text-rose-600"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {active && alerts.length > 0 ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="font-heading text-lg font-semibold text-slate-800">
              Line Waste Alerts
            </div>
            <div className="text-xs text-slate-500">
              Flag any line-day exceeding your waste limit
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Max recut / line / day
          </label>
          <input
            type="number"
            min={0}
            value={threshold || ""}
            onChange={(e) => onThresholdChange(parseInt(e.target.value || "0", 10))}
            placeholder="e.g. 50"
            data-testid="threshold-input"
            className="w-28 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      {!active ? (
        <div
          className="rounded-2xl bg-slate-50 px-5 py-6 text-center text-sm text-slate-500"
          data-testid="threshold-inactive"
        >
          Enter a waste limit above to actively flag lines that exceed it.
        </div>
      ) : alerts.length === 0 ? (
        <div
          className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
          data-testid="threshold-clear"
        >
          <ShieldCheck className="h-4 w-4" />
          All production lines are within the {threshold.toLocaleString()}-unit
          daily limit.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="threshold-alerts-list">
          {alerts.map((a, i) => {
            const severe = a.overBy > threshold * 0.5;
            return (
              <div
                key={`${a.line}-${a.date}-${i}`}
                data-testid="threshold-alert-item"
                className={`animate-fade-up rounded-2xl border p-4 ${
                  severe
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-heading text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    Line {a.line}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      severe
                        ? "bg-rose-200/60 text-rose-800"
                        : "bg-amber-200/60 text-amber-800"
                    }`}
                  >
                    {severe ? "Critical" : "Over limit"}
                  </span>
                </div>
                <div className="mt-2 font-heading text-2xl font-bold">
                  {a.quantity.toLocaleString()}
                  <span className="ml-2 text-xs font-medium text-current/70">
                    +{a.overBy.toLocaleString()} over
                  </span>
                </div>
                <div className="mt-1 text-xs opacity-80">
                  {a.factory} · {a.date}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
