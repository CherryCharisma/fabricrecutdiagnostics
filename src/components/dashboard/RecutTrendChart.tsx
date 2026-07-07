import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Granularity, RecutRow } from "@/lib/types";
import { recutTrend } from "@/lib/aggregations";

interface RecutTrendChartProps {
  rows: RecutRow[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

const options: { key: Granularity; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export function RecutTrendChart({
  rows,
  granularity,
  onGranularityChange,
}: RecutTrendChartProps) {
  const data = recutTrend(rows, granularity);

  return (
    <div
      className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="recut-trend-card"
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-heading text-lg font-semibold text-slate-800">
            Recut Trend
          </div>
          <div className="text-xs text-slate-500">
            Compare recut volume{" "}
            <span className="font-semibold text-slate-700">
              {granularity === "day"
                ? "day by day"
                : granularity === "week"
                  ? "week by week"
                  : "month by month"}
            </span>
          </div>
        </div>

        <div
          className="inline-flex rounded-full bg-slate-100 p-1"
          role="tablist"
          data-testid="granularity-toggle"
        >
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => onGranularityChange(o.key)}
              data-testid={`granularity-${o.key}`}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                granularity === o.key
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          No dated rows to plot yet.
        </div>
      ) : (
        <div className="h-64 w-full" style={{ minHeight: 240 }} data-testid="recut-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="recutFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#334155", fontWeight: 600 }}
                formatter={(value: number | string | undefined) =>
                  [`${Number(value ?? 0).toLocaleString()} units`, "Recut"]
                }
              />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fill="url(#recutFill)"
                dot={{ r: 3, fill: "#f43f5e" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
