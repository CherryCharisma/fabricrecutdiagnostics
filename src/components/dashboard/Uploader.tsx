import { useCallback, useState } from "react";
import { FileSpreadsheet, UploadCloud, X, CheckCircle2, Info } from "lucide-react";
import { parseExcelFile } from "@/lib/excel";
import type { RecutRow } from "@/lib/types";
import { toast } from "sonner";

interface UploaderProps {
  onParsed: (filename: string, rows: RecutRow[]) => void;
  activeFileName?: string | null;
  onClear?: () => void;
}

export function Uploader({ onParsed, activeFileName, onClear }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [unmappedCols, setUnmappedCols] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "xlsx" && ext !== "xls") {
        toast.error("Unsupported file", {
          description: "Please upload a .xlsx or .xls file.",
        });
        return;
      }

      setIsParsing(true);
      setUnmappedCols([]);
      setMapping({});
      try {
        const { rows, unmappedColumns, columnMapping } =
          await parseExcelFile(file);

        if (rows.length === 0) {
          toast.error("No data rows found in the file", {
            description:
              "We couldn't extract any recut rows. Please check that the sheet contains data below the header.",
          });
          return;
        }

        setUnmappedCols(unmappedColumns ?? []);
        setMapping(columnMapping ?? {});
        onParsed(file.name, rows);
        toast.success("Report parsed", {
          description: `${rows.length} rows loaded from ${file.name}`,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse Excel file");
      } finally {
        setIsParsing(false);
      }
    },
    [onParsed]
  );

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const mappedEntries = Object.entries(mapping);

  return (
    <div className="space-y-3" data-testid="uploader-section">
      <label
        htmlFor="excel-input"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        data-testid="upload-dropzone"
        className={[
          "group relative flex cursor-pointer flex-col items-center justify-center",
          "rounded-3xl border-2 border-dashed p-10 md:p-14 text-center",
          "transition-all duration-300",
          isDragging
            ? "border-blue-400 bg-blue-100/60"
            : "border-blue-300 bg-blue-50/50 hover:bg-blue-50",
        ].join(" ")}
      >
        <input
          id="excel-input"
          data-testid="excel-file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={onInputChange}
          className="hidden"
        />
        <div className="mb-4 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-blue-200/60 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 shadow-lg shadow-sky-200 md:h-20 md:w-20">
              <FileSpreadsheet
                className="h-9 w-9 text-white md:h-10 md:w-10"
                strokeWidth={1.75}
              />
            </div>
          </div>
        </div>
        <div className="font-heading text-lg font-semibold text-slate-800 md:text-xl">
          Drop your Grid Frontline export here
        </div>
        <div className="mt-1.5 text-sm text-slate-500">
          or <span className="text-blue-600 underline underline-offset-4">browse</span> to select an .xlsx / .xls file
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          <UploadCloud className="h-3.5 w-3.5" /> Header rows are auto-detected
        </div>
      </label>

      {activeFileName ? (
        <div
          data-testid="upload-success-banner"
          className="flex items-center justify-between rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>Loaded:</span>
            <span className="font-semibold" data-testid="active-file-name">
              {activeFileName}
            </span>
          </div>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              data-testid="clear-upload-btn"
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          ) : null}
        </div>
      ) : (
        <div
          data-testid="awaiting-upload-banner"
          className="rounded-2xl bg-purple-100 px-5 py-3 text-center text-sm font-medium text-purple-800"
        >
          {isParsing
            ? "🔍 Parsing report…"
            : "📥 Awaiting Factory Excel Report Upload..."}
        </div>
      )}

      {activeFileName && mappedEntries.length > 0 ? (
        <div
          data-testid="column-mapping-card"
          className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-700"
        >
          <div className="mb-2 flex items-center gap-1.5 text-slate-600">
            <Info className="h-3.5 w-3.5" />
            <span className="font-semibold uppercase tracking-wider">
              Detected column mapping
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mappedEntries.map(([canonical, original]) => (
              <span
                key={canonical}
                data-testid={`mapped-${canonical}`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-900"
              >
                <span className="font-semibold">{canonical}</span>
                {original && original !== canonical ? (
                  <>
                    <span className="opacity-60">←</span>
                    <span className="text-emerald-800">{original}</span>
                  </>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {activeFileName && unmappedCols.length > 0 ? (
        <div
          data-testid="unmapped-columns-notice"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900"
        >
          <div className="font-semibold">Some columns weren't auto-detected</div>
          <div className="mt-1 text-amber-800">
            Parsed the file, but couldn't map: {unmappedCols.join(", ")}. Those
            fields will show as empty in the dashboard.
          </div>
        </div>
      ) : null}
    </div>
  );
}
