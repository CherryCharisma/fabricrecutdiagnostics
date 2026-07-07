import type { RecutRow } from "@/lib/types";
import { factoryBreakdown, topReasons } from "@/lib/aggregations";

interface BreakdownCardsProps {
  rows: RecutRow[];
}

function Row({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="truncate pr-2 text-slate-700" title={label}>
          {label}
        </div>
        <div className="font-heading font-semibold tabular-nums text-slate-800">
          {value.toLocaleString()}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BreakdownCards({ rows }: BreakdownCardsProps) {
  const factories = factoryBreakdown(rows);
  const reasons = topReasons(rows, 6);

  const facMax = factories[0]?.value || 0;
  const rMax = reasons[0]?.value || 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div
        className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        data-testid="factory-breakdown-card"
      >
        <div className="mb-4">
          <div className="font-heading text-lg font-semibold text-slate-800">
            Factory-wise Recut
          </div>
          <div className="text-xs text-slate-500">
            Total recut quantity by factory
          </div>
        </div>
        {factories.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No factory data yet.
          </div>
        ) : (
          <div className="space-y-4">
            {factories.map((b) => (
              <Row
                key={b.label}
                label={b.label}
                value={b.value}
                max={facMax}
                color="bg-gradient-to-r from-sky-400 to-blue-500"
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        data-testid="top-reasons-card"
      >
        <div className="mb-4">
          <div className="font-heading text-lg font-semibold text-slate-800">
            Top Recut Reasons
          </div>
          <div className="text-xs text-slate-500">
            Where fabric waste is coming from
          </div>
        </div>
        {reasons.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No reason data yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reasons.map((b) => (
              <Row
                key={b.label}
                label={b.label}
                value={b.value}
                max={rMax}
                color="bg-gradient-to-r from-rose-400 to-pink-500"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
