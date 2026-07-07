import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Uploader } from "@/components/dashboard/Uploader";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { RecutTrendChart } from "@/components/dashboard/RecutTrendChart";
import { BreakdownCards } from "@/components/dashboard/BreakdownCards";
import { DataTableView } from "@/components/dashboard/DataTableView";
import { UploadHistory } from "@/components/dashboard/UploadHistory";
import { ReasonsPieChart } from "@/components/dashboard/ReasonsPieChart";
import { LineBarChart } from "@/components/dashboard/LineBarChart";
import { ThresholdAlerts } from "@/components/dashboard/ThresholdAlerts";
import { AnalysisSummaryCard } from "@/components/dashboard/AnalysisSummaryCard";
import { Toaster } from "sonner";
import { downloadTemplate } from "@/lib/excel";
import { applyFilters } from "@/lib/aggregations";
import { createUpload } from "@/lib/api";
import type {
  DashboardFilters,
  Granularity,
  RecutRow,
} from "@/lib/types";
import { toast } from "sonner";

const EMPTY_FILTERS: DashboardFilters = {
  dateFrom: null,
  dateTo: null,
  factory: null,
  line: null,
  product: null,
  parts: null,
  workOrderNumber: null,
};

export default function Dashboard() {
  const [rows, setRows] = useState<RecutRow[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS);
  const [historyKey, setHistoryKey] = useState(0);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [threshold, setThreshold] = useState<number>(0);

  const filteredRows = useMemo(
    () => applyFilters(rows, filters),
    [rows, filters]
  );

  const handleParsed = async (name: string, parsed: RecutRow[]) => {
    setFilename(name);
    setRows(parsed);
    setFilters(EMPTY_FILTERS);
    try {
      await createUpload(name, parsed);
      setHistoryKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      toast.warning("Data loaded locally, but history save failed");
    }
  };

  const handleRestore = (name: string, parsed: RecutRow[]) => {
    setFilename(name);
    setRows(parsed);
    setFilters(EMPTY_FILTERS);
  };

  const handleClear = () => {
    setFilename(null);
    setRows([]);
    setFilters(EMPTY_FILTERS);
  };

  const handleDownloadTemplate = () => {
    try {
      downloadTemplate();
      toast.success("Template downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download template");
    }
  };

  const hasData = rows.length > 0;

  return (
    <div
      className="min-h-screen w-full bg-canvas text-slate-800"
      data-testid="dashboard-root"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontFamily: "DM Sans" },
        }}
      />

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12 lg:px-12">
        {/* Header */}
        <header
          className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between"
          data-testid="dashboard-header"
        >
          <div>
            <h1
              className="font-heading text-4xl font-bold tracking-tight text-slate-800 md:text-5xl lg:text-6xl"
              data-testid="app-title"
            >
              Fabric Recut Diagnostics
            </h1>
            <div
              className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-rose-800/70"
              data-testid="app-subtitle"
            >
              Apparel Process Intelligence
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            data-testid="download-template-btn"
            className="group inline-flex items-center gap-2 self-start rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg"
          >
            <span className="text-base leading-none">📥</span>
            <span>Download template</span>
            <Download className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
          </button>
        </header>

        {/* Uploader + History side by side on wide screens */}
        <section
          className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
          data-testid="upload-section"
        >
          <div className="lg:col-span-2">
            <Uploader
              onParsed={handleParsed}
              activeFileName={filename}
              onClear={hasData ? handleClear : undefined}
            />
          </div>
          <div>
            <UploadHistory
              refreshToken={historyKey}
              onRestore={handleRestore}
            />
          </div>
        </section>

        {hasData ? (
          <div className="space-y-6" data-testid="analytics-section">
            <FiltersBar rows={rows} filters={filters} onChange={setFilters} />

            <AnalysisSummaryCard rows={filteredRows} />

            <KpiCards rows={filteredRows} />

            <RecutTrendChart
              rows={filteredRows}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <LineBarChart rows={filteredRows} threshold={threshold} />
              <ReasonsPieChart rows={filteredRows} />
            </div>

            <ThresholdAlerts
              rows={filteredRows}
              threshold={threshold}
              onThresholdChange={setThreshold}
            />

            <BreakdownCards rows={filteredRows} />

            <DataTableView rows={filteredRows} />
          </div>
        ) : (
          <div
            className="mt-4 rounded-3xl border border-dashed border-rose-200 bg-white/70 p-10 text-center"
            data-testid="empty-state"
          >
            <div className="font-heading text-xl font-semibold text-slate-800">
              Ready when you are
            </div>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Upload a Grid Frontline Excel export to unlock KPIs, trend
              analytics, factory-wise breakdowns, threshold alerts, and
              searchable recut records.
            </p>
          </div>
        )}

        <footer className="mt-16 border-t border-slate-200/60 pt-6 text-center text-xs text-slate-400">
          Fabric Recut Diagnostics · Built for apparel factory process
          intelligence
        </footer>
      </div>
    </div>
  );
}
