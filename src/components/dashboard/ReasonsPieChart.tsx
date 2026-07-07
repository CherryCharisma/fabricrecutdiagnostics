import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RecutRow } from "@/lib/types";
import { topReasons } from "@/lib/aggregations";

const COLORS = [
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#38bdf8", // sky
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#6366f1", // indigo
  "#f97316", // orange
];

interface ReasonsPieChartProps {
  rows: RecutRow[];
}

export function ReasonsPieChart({ rows }: ReasonsPieChartProps) {
  const data = topReasons(rows, 7).map((b, i) => ({
    name: b.label,
    value: b.value,
    color: COLORS[i % COLORS.length],
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div
      className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="reasons-pie-card"
    >
      <div className="mb-4">
        <div className="font-heading text-lg font-semibold text-slate-800">
          Recut Reasons Distribution
        </div>
        <div className="text-xs text-slate-500">
          Share of waste by root cause
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          No reasons to plot.
        </div>
      ) : (
        <div className="h-72 w-full" style={{ minHeight: 260 }} data-testid="reasons-pie-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`c-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string | undefined, name: unknown) => {
                  const v = Number(value ?? 0);
                  return [
                    `${v.toLocaleString()} units (${total > 0 ? Math.round((v / total) * 100) : 0}%)`,
                    String(name ?? ""),
                  ];
                }}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: "#475569" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
