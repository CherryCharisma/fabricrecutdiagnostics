import { useMemo } from "react";
import type { DashboardFilters, RecutRow } from "@/lib/types";
import { uniqueValues } from "@/lib/aggregations";
import { X } from "lucide-react";

interface FiltersBarProps {
  rows: RecutRow[];
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
}

const inputCls =
  "w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition";

export function FiltersBar({ rows, filters, onChange }: FiltersBarProps) {
  const factories = useMemo(() => uniqueValues(rows, "factory"), [rows]);
  const lines = useMemo(() => uniqueValues(rows, "line"), [rows]);
  const products = useMemo(() => uniqueValues(rows, "product"), [rows]);
  const parts = useMemo(() => uniqueValues(rows, "parts"), [rows]);
  const workOrders = useMemo(
    () => uniqueValues(rows, "workOrderNumber"),
    [rows]
  );

  const set = <K extends keyof DashboardFilters>(
    key: K,
    val: DashboardFilters[K]
  ) => onChange({ ...filters, [key]: val });

  const clearAll = () =>
    onChange({
      dateFrom: null,
      dateTo: null,
      factory: null,
      line: null,
      product: null,
      parts: null,
      workOrderNumber: null,
    });

  const hasAny =
    filters.dateFrom ||
    filters.dateTo ||
    filters.factory ||
    filters.line ||
    filters.product ||
    filters.parts ||
    filters.workOrderNumber;

  return (
    <div
      className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="filters-bar"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-heading text-sm font-semibold text-slate-800">
          Filter Diagnostics
        </div>
        {hasAny ? (
          <button
            type="button"
            onClick={clearAll}
            data-testid="clear-filters-btn"
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
        <div className="flex flex-col gap-1">
          <label className="pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            From
          </label>
          <input
            type="date"
            data-testid="filter-date-from"
            className={inputCls}
            value={filters.dateFrom || ""}
            onChange={(e) => set("dateFrom", e.target.value || null)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            To
          </label>
          <input
            type="date"
            data-testid="filter-date-to"
            className={inputCls}
            value={filters.dateTo || ""}
            onChange={(e) => set("dateTo", e.target.value || null)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Factory
          </label>
          <select
            data-testid="filter-factory"
            className={inputCls}
            value={filters.factory || ""}
            onChange={(e) => set("factory", e.target.value || null)}
          >
            <option value="">All factories</option>
            {factories.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Line
          </label>
          <select
            data-testid="filter-line"
            className={inputCls}
            value={filters.line || ""}
            onChange={(e) => set("line", e.target.value || null)}
          >
            <option value="">All lines</option>
            {lines.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Product
          </label>
          <select
            data-testid="filter-product"
            className={inputCls}
            value={filters.product || ""}
            onChange={(e) => set("product", e.target.value || null)}
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Parts
          </label>
          <select
            data-testid="filter-parts"
            className={inputCls}
            value={filters.parts || ""}
            onChange={(e) => set("parts", e.target.value || null)}
          >
            <option value="">All parts</option>
            {parts.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Work Order
          </label>
          <select
            data-testid="filter-work-order"
            className={inputCls}
            value={filters.workOrderNumber || ""}
            onChange={(e) => set("workOrderNumber", e.target.value || null)}
          >
            <option value="">All work orders</option>
            {workOrders.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
