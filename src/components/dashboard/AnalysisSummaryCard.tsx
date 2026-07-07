import { Sparkles } from "lucide-react";
import type { RecutRow } from "@/lib/types";
import { buildAnalysis } from "@/lib/aggregations";

interface AnalysisSummaryCardProps {
  rows: RecutRow[];
}

export function AnalysisSummaryCard({ rows }: AnalysisSummaryCardProps) {
  const a = buildAnalysis(rows);

  const kpis = [
    { label: "Total Recut", value: a.totalRecut.toLocaleString() },
    { label: "Rows", value: a.totalRows.toLocaleString() },
    { label: "Factories", value: a.factoryCount.toLocaleString() },
    { label: "Lines", value: a.lineCount.toLocaleString() },
    { label: "Products", value: a.productCount.toLocaleString() },
    { label: "Work Orders", value: a.workOrderCount.toLocaleString() },
    { label: "Active Days", value: a.dayCount.toLocaleString() },
    {
      label: "Avg / Day",
      value: a.avgPerDay > 0 ? a.avgPerDay.toFixed(1) : "0",
    },
  ];

  return (
    <div
      className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-purple-50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="analysis-summary-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-heading text-lg font-semibold text-slate-800">
              Automated Analysis
            </div>
            <div className="text-xs text-slate-500">
              Insights derived from your uploaded report
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8"
        data-testid="analysis-kpis"
      >
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl bg-white/70 p-3 backdrop-blur-sm"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {k.label}
            </div>
            <div className="mt-1 font-heading text-xl font-bold text-slate-800">
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {a.insights.length > 0 ? (
        <ul
          className="mt-5 space-y-2"
          data-testid="analysis-insights"
        >
          {a.insights.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-2xl bg-white/60 px-4 py-2.5 text-sm text-slate-700 backdrop-blur-sm"
              data-testid="analysis-insight-item"
            >
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
