import { useMemo, useState } from "react";
import type { RecutRow } from "@/lib/types";
import { Search } from "lucide-react";

interface DataTableViewProps {
  rows: RecutRow[];
}

const PAGE_SIZE = 20;

function extraToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

export function DataTableView({ rows }: DataTableViewProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Collect all extra column keys across all rows (union) so the table shows
  // every column from the source file — nothing is missed.
  const extraKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.extra) Object.keys(r.extra).forEach((k) => set.add(k));
    }
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const extraStr = r.extra
        ? Object.values(r.extra).map(extraToString).join(" ")
        : "";
      return [
        r.factory,
        r.workOrderNumber,
        r.line,
        r.product,
        r.parts,
        r.reasonForRecut,
        r.date ?? "",
        extraStr,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);
  const colSpan = 9 + extraKeys.length;

  return (
    <div
      className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="data-table-card"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-heading text-lg font-semibold text-slate-800">
            Recut Records
          </div>
          <div className="text-xs text-slate-500">
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()}{" "}
            rows
            {extraKeys.length > 0 ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                +{extraKeys.length} extra column{extraKeys.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            data-testid="data-table-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search factory, product, reason…"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[900px] text-sm"
          data-testid="recut-data-table"
        >
          <thead>
            <tr className="bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3">Date</th>
              <th className="px-4 py-3">Factory</th>
              <th className="px-4 py-3">WO #</th>
              <th className="px-4 py-3">Line</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Parts</th>
              <th className="px-4 py-3 text-right">Size</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-6 py-3">Reason</th>
              {extraKeys.map((k) => (
                <th key={k} className="px-4 py-3" title={k}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((r, i) => (
              <tr key={i} className="hover:bg-rose-50/40">
                <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                  {r.date || "—"}
                </td>
                <td className="px-4 py-4 text-slate-700">{r.factory || "—"}</td>
                <td className="px-4 py-4 font-mono text-xs text-slate-600">
                  {r.workOrderNumber || "—"}
                </td>
                <td className="px-4 py-4 text-slate-700">{r.line || "—"}</td>
                <td className="px-4 py-4 text-slate-700">{r.product || "—"}</td>
                <td className="px-4 py-4 text-slate-600">{r.parts || "—"}</td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-700">
                  {r.size || "—"}
                </td>
                <td className="px-4 py-4 text-right font-heading font-semibold tabular-nums text-slate-800">
                  {r.quantity || "—"}
                </td>
                <td className="px-6 py-4">
                  {r.reasonForRecut ? (
                    <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      {r.reasonForRecut}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                {extraKeys.map((k) => (
                  <td key={k} className="px-4 py-4 text-slate-600">
                    {r.extra && r.extra[k] !== undefined && r.extra[k] !== ""
                      ? extraToString(r.extra[k])
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  No matching rows.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm">
          <div className="text-slate-500">
            Page {currentPage} of {pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="table-prev-page"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-200"
            >
              Prev
            </button>
            <button
              type="button"
              data-testid="table-next-page"
              disabled={currentPage >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
