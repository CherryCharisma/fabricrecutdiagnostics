export type Granularity = "day" | "week" | "month";

export interface RecutRow {
  date: string | null; // ISO date YYYY-MM-DD or null
  factory: string;
  workOrderNumber: string;
  line: string;
  product: string;
  parts: string;
  size: number;
  quantity: number;
  reasonForRecut: string;
  // Any additional columns from the source file that weren't mapped to a
  // canonical field. Preserved so nothing in the user's file is lost.
  extra?: Record<string, unknown>;
}

export interface ParsedWorkbook {
  rows: RecutRow[];
  missingColumns: string[];
  unmappedColumns?: string[];
  columnMapping?: Record<string, string>;
  allHeaders?: string[];
}

export interface UploadSummary {
  id: string;
  filename: string;
  rowCount: number;
  totalQuantity: number;
  uploadedAt: string;
}

export interface UploadFull extends UploadSummary {
  rows: RecutRow[];
}

export interface DashboardFilters {
  dateFrom: string | null;
  dateTo: string | null;
  factory: string | null;
  line: string | null;
  product: string | null;
  parts: string | null;
  workOrderNumber: string | null;
}

export interface LineAlert {
  line: string;
  date: string;
  quantity: number;
  overBy: number;
  factory: string;
}

export interface AnalysisSummary {
  totalRecut: number;
  totalRows: number;
  factoryCount: number;
  lineCount: number;
  productCount: number;
  workOrderCount: number;
  dayCount: number;
  worstFactory: { label: string; value: number } | null;
  worstLine: { label: string; value: number } | null;
  worstDay: { label: string; value: number } | null;
  topReason: { label: string; value: number } | null;
  avgPerDay: number;
  insights: string[];
}
