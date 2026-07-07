import { useCallback, useEffect, useState } from "react";
import { History, Trash2, Loader2, RotateCcw } from "lucide-react";
import type { UploadSummary } from "@/lib/types";
import { deleteUpload, fetchUpload, listUploads } from "@/lib/api";
import { toast } from "sonner";

interface UploadHistoryProps {
  refreshToken: number;
  onRestore: (filename: string, rows: import("@/lib/types").RecutRow[]) => void;
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function UploadHistory({ refreshToken, onRestore }: UploadHistoryProps) {
  const [items, setItems] = useState<UploadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listUploads();
      setItems(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [refreshToken, load]);

  const handleDelete = async (id: string) => {
    try {
      await deleteUpload(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Upload removed from history");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete upload");
    }
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const full = await fetchUpload(id);
      onRestore(full.filename, full.rows);
      toast.success(`Restored ${full.filename}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not restore upload");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div
      className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      data-testid="upload-history-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <History className="h-4 w-4" />
          </div>
          <div>
            <div className="font-heading text-lg font-semibold text-slate-800">
              Upload History
            </div>
            <div className="text-xs text-slate-500">
              Reload any prior factory report
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl bg-slate-50 py-8 text-center text-sm text-slate-500"
          data-testid="upload-history-empty"
        >
          No uploads yet. Drop an Excel report above to get started.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100" data-testid="upload-history-list">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-3 py-3"
              data-testid={`upload-history-item-${it.id}`}
            >
              <div className="min-w-0">
                <div
                  className="truncate font-medium text-slate-800"
                  title={it.filename}
                >
                  {it.filename}
                </div>
                <div className="text-xs text-slate-500">
                  {it.rowCount.toLocaleString()} rows ·{" "}
                  {it.totalQuantity.toLocaleString()} qty · {relTime(it.uploadedAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid={`restore-upload-btn-${it.id}`}
                  onClick={() => handleRestore(it.id)}
                  disabled={restoringId === it.id}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 disabled:opacity-60"
                >
                  {restoringId === it.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Load
                </button>
                <button
                  type="button"
                  data-testid={`delete-upload-btn-${it.id}`}
                  onClick={() => handleDelete(it.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
