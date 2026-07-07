import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RecutRow } from "@/lib/types";
import { lineBreakdown } from "@/lib/aggregations";

interface LineBarChartProps {
  rows: RecutRow[];
  threshold?: number;
}

const BAR_COLORS = ["#38bdf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#f87171", "#818cf8", "#fb923c"];

export function LineBarChart({ rows, threshold }: LineBarChartProps) {
  const data = lineBreakdown(rows).map((b, i) => ({
    line: b.label,
    quantity: b.value,
    color: BAR_COLORS[i % BAR_COLORS.length],
    isOver: !!(threshold && threshold > 0 && b.value > threshold),
  }));

  return (
    <div
      className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="line-bar-card"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="font-heading text-lg font-semibold text-slate-800">
            Recut Volume by Line
          </div>
          <div className="text-xs text-slate-500">
            Hover any bar to see the total recut for that line
          </div>
        </div>
        {threshold && threshold > 0 ? (
          <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            Limit: {threshold.toLocaleString()}
          </span>
        ) : null}
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          No line data available.
        </div>
      ) : (
        <div className="h-72 w-full" style={{ minHeight: 260 }} data-testid="line-bar-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 8 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="line"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={data.length > 6 ? -20 : 0}
                textAnchor={data.length > 6 ? "end" : "middle"}
                height={data.length > 6 ? 60 : 30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                cursor={{ fill: "rgba(244, 63, 94, 0.06)" }}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                  fontSize: 12,
                }}
                formatter={(value: number | string | undefined, _n: unknown, props: { payload?: { line?: string } }) => [
                  `${Number(value ?? 0).toLocaleString()} units total`,
                  `Line ${props.payload?.line ?? ""}`,
                ]}
                labelFormatter={() => ""}
              />
              <Bar dataKey="quantity" radius={[8, 8, 0, 0]} maxBarSize={54}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.isOver ? "#f43f5e" : entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
