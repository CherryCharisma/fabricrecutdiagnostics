import type {
  AnalysisSummary,
  DashboardFilters,
  Granularity,
  LineAlert,
  RecutRow,
} from "./types";

export function applyFilters(
  rows: RecutRow[],
  filters: DashboardFilters
): RecutRow[] {
  return rows.filter((row) => {
    if (filters.dateFrom && (!row.date || row.date < filters.dateFrom)) return false;
    if (filters.dateTo && (!row.date || row.date > filters.dateTo)) return false;
    if (filters.factory && row.factory !== filters.factory) return false;
    if (filters.line && row.line !== filters.line) return false;
    if (filters.product && row.product !== filters.product) return false;
    if (filters.parts && row.parts !== filters.parts) return false;
    if (
      filters.workOrderNumber &&
      row.workOrderNumber !== filters.workOrderNumber
    )
      return false;
    return true;
  });
}

export function uniqueValues(rows: RecutRow[], key: keyof RecutRow): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const v = row[key];
    if (typeof v === "string" && v.trim() !== "") set.add(v);
  }
  return Array.from(set).sort();
}

export function totalQuantity(rows: RecutRow[]): number {
  return rows.reduce((s, r) => s + (r.quantity || 0), 0);
}

export function distinctCount(rows: RecutRow[], key: keyof RecutRow): number {
  return uniqueValues(rows, key).length;
}

export interface Bucket {
  label: string;
  value: number;
}

function groupSum(
  rows: RecutRow[],
  key: keyof RecutRow,
  limit?: number
): Bucket[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = row[key];
    const label = typeof raw === "string" && raw.trim() ? raw : "(Unspecified)";
    map.set(label, (map.get(label) || 0) + (row.quantity || 0));
  }
  const list = Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  return limit ? list.slice(0, limit) : list;
}

export function topReasons(rows: RecutRow[], limit = 5): Bucket[] {
  return groupSum(rows, "reasonForRecut", limit);
}

export function factoryBreakdown(rows: RecutRow[]): Bucket[] {
  return groupSum(rows, "factory");
}

export function lineBreakdown(rows: RecutRow[]): Bucket[] {
  return groupSum(rows, "line");
}

export function productBreakdown(rows: RecutRow[], limit = 8): Bucket[] {
  return groupSum(rows, "product", limit);
}

export interface TrendPoint {
  bucket: string;
  quantity: number;
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  // ISO 8601 week
  const target = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNum =
    Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function toBucket(dateStr: string, granularity: Granularity): string {
  if (granularity === "day") return dateStr;
  if (granularity === "month") return dateStr.slice(0, 7); // YYYY-MM
  return isoWeek(dateStr);
}

export function recutTrend(
  rows: RecutRow[],
  granularity: Granularity = "day"
): TrendPoint[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.date) continue;
    const b = toBucket(row.date, granularity);
    map.set(b, (map.get(b) || 0) + (row.quantity || 0));
  }
  return Array.from(map.entries())
    .map(([bucket, quantity]) => ({ bucket, quantity }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}

export function linePerDayTotals(rows: RecutRow[]): {
  line: string;
  date: string;
  quantity: number;
  factory: string;
}[] {
  const map = new Map<
    string,
    { line: string; date: string; quantity: number; factory: string }
  >();
  for (const row of rows) {
    if (!row.date || !row.line) continue;
    const key = `${row.line}||${row.date}`;
    const prev = map.get(key);
    if (prev) {
      prev.quantity += row.quantity || 0;
    } else {
      map.set(key, {
        line: row.line,
        date: row.date,
        quantity: row.quantity || 0,
        factory: row.factory || "(Unspecified)",
      });
    }
  }
  return Array.from(map.values());
}

export function lineAlerts(rows: RecutRow[], limit: number): LineAlert[] {
  if (!limit || limit <= 0) return [];
  const totals = linePerDayTotals(rows);
  return totals
    .filter((t) => t.quantity > limit)
    .map((t) => ({
      line: t.line,
      date: t.date,
      factory: t.factory,
      quantity: t.quantity,
      overBy: t.quantity - limit,
    }))
    .sort((a, b) => b.quantity - a.quantity);
}

export function buildAnalysis(rows: RecutRow[]): AnalysisSummary {
  const total = totalQuantity(rows);
  const factories = factoryBreakdown(rows);
  const lines = lineBreakdown(rows);
  const days = recutTrend(rows, "day");
  const reasons = topReasons(rows, 1);
  const dayCount = days.length;

  const worstDay = days.length
    ? days.reduce((a, b) => (b.quantity > a.quantity ? b : a))
    : null;

  const insights: string[] = [];
  if (rows.length === 0) {
    insights.push("No data to analyse — upload a report to begin.");
  } else {
    if (factories[0]) {
      const pct = total > 0 ? Math.round((factories[0].value / total) * 100) : 0;
      insights.push(
        `${factories[0].label} accounts for ${pct}% of all recut units (${factories[0].value.toLocaleString()}).`
      );
    }
    if (lines[0]) {
      insights.push(
        `${lines[0].label} is the highest-loss production line with ${lines[0].value.toLocaleString()} recut units.`
      );
    }
    if (reasons[0]) {
      const pct = total > 0 ? Math.round((reasons[0].value / total) * 100) : 0;
      insights.push(
        `Root cause: "${reasons[0].label}" drives ${pct}% of recut waste.`
      );
    }
    if (worstDay) {
      insights.push(
        `${worstDay.bucket} was the worst day with ${worstDay.quantity.toLocaleString()} recut units.`
      );
    }
    const avg = dayCount > 0 ? total / dayCount : 0;
    if (avg > 0) {
      insights.push(
        `Average of ${avg.toFixed(1)} recut units per active production day across ${dayCount} day${dayCount === 1 ? "" : "s"}.`
      );
    }
  }

  return {
    totalRecut: total,
    totalRows: rows.length,
    factoryCount: distinctCount(rows, "factory"),
    lineCount: distinctCount(rows, "line"),
    productCount: distinctCount(rows, "product"),
    workOrderCount: distinctCount(rows, "workOrderNumber"),
    dayCount,
    worstFactory: factories[0]
      ? { label: factories[0].label, value: factories[0].value }
      : null,
    worstLine: lines[0]
      ? { label: lines[0].label, value: lines[0].value }
      : null,
    worstDay: worstDay
      ? { label: worstDay.bucket, value: worstDay.quantity }
      : null,
    topReason: reasons[0]
      ? { label: reasons[0].label, value: reasons[0].value }
      : null,
    avgPerDay: dayCount > 0 ? total / dayCount : 0,
    insights,
  };
}
