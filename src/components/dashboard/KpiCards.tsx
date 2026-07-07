import { Scissors, Factory, Layers, AlertCircle } from "lucide-react";
import type { RecutRow } from "@/lib/types";
import {
  distinctCount,
  topReasons,
  totalQuantity,
} from "@/lib/aggregations";

interface KpiCardsProps {
  rows: RecutRow[];
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function KpiCards({ rows }: KpiCardsProps) {
  const total = totalQuantity(rows);
  const factories = distinctCount(rows, "factory");
  const lines = distinctCount(rows, "line");
  const reasons = topReasons(rows, 1);
  const topReason = reasons[0]?.label || "—";
  const topReasonQty = reasons[0]?.value || 0;

  const cards = [
    {
      label: "Total Recut Qty",
      value: formatNumber(total),
      hint: `${rows.length.toLocaleString()} rows analysed`,
      icon: <Scissors className="h-5 w-5" />,
      accent: "bg-rose-100 text-rose-600",
      testId: "kpi-total-recut",
    },
    {
      label: "Factories",
      value: formatNumber(factories),
      hint: `${lines} production lines`,
      icon: <Factory className="h-5 w-5" />,
      accent: "bg-blue-100 text-blue-600",
      testId: "kpi-factories",
    },
    {
      label: "Distinct Products",
      value: formatNumber(distinctCount(rows, "product")),
      hint: `${distinctCount(rows, "workOrderNumber")} work orders`,
      icon: <Layers className="h-5 w-5" />,
      accent: "bg-purple-100 text-purple-600",
      testId: "kpi-products",
    },
    {
      label: "Top Recut Reason",
      value: topReason,
      hint: `${formatNumber(topReasonQty)} units affected`,
      icon: <AlertCircle className="h-5 w-5" />,
      accent: "bg-amber-100 text-amber-600",
      testId: "kpi-top-reason",
      isText: true,
    },
  ];

  return (
    <div
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4"
      data-testid="kpi-grid"
    >
      {cards.map((c, i) => (
        <div
          key={c.label}
          data-testid={c.testId}
          className="group animate-fade-up rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {c.label}
            </div>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.accent}`}
            >
              {c.icon}
            </div>
          </div>
          <div
            className={`mt-4 font-heading font-bold text-slate-800 ${
              c.isText ? "text-lg md:text-xl truncate" : "text-3xl md:text-4xl"
            }`}
            title={c.isText ? String(c.value) : undefined}
          >
            {c.value}
          </div>
          <div className="mt-1 text-xs text-slate-500">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}
