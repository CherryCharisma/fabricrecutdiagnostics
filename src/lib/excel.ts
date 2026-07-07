import * as XLSX from "xlsx";
import type { ParsedWorkbook, RecutRow } from "./types";

// Canonical required columns + a wide net of accepted aliases. All matching
// is done on a normalized key (lower-case, alphanumerics only).
const COLUMN_ALIASES: Record<string, string[]> = {
  Date: [
    "date", "recutdate", "reportdate", "reportingdate", "shiftdate",
    "productiondate", "cuttingdate", "dateofrecut", "recuttingdate", "cutdate",
    "day", "reportedon", "createdon", "createdat", "on", "onedate",
  ],
  Factory: [
    "factory", "factoryname", "factorycode", "factoryref", "unit", "unitname",
    "plant", "plantname", "location", "site", "branch", "office", "mill",
    "millname", "vendor", "supplier", "manufacturer",
  ],
  Work_order_number: [
    "workordernumber", "workorderno", "workorderid", "workorder",
    "workorderref", "wonumber", "wono", "wo", "orderno", "ordernumber",
    "orderid", "orderref", "po", "ponumber", "purchaseorder", "purchaseorderno",
    "cutorderno", "cuttingorderno", "batchno", "batchnumber", "batch",
    "buyerorder", "buyerorderno", "job", "jobno", "jobnumber",
  ],
  Line: [
    "line", "lineno", "linenumber", "linename", "linecode", "lineref",
    "productionline", "productionlineno", "sewingline", "sewinglineno",
    "cuttingline", "cuttinglineno",
  ],
  Product: [
    "product", "productname", "productcode", "productref", "style", "styleno",
    "stylenumber", "styleref", "stylename", "styledesc", "styledescription",
    "article", "articleno", "articlename", "articlecode", "item", "itemname",
    "itemcode", "sku", "skuno", "modelname", "modelno", "model",
  ],
  Parts: [
    "parts", "part", "partname", "partcode", "component", "componentname",
    "panel", "panels", "panelcode", "cutpart", "cutpanel", "recutpart",
    "recutpanel", "piece", "pieces",
  ],
  Size: [
    "size", "sizes", "sizecode", "sizeno", "sizename", "sizedesc",
    "sizedescription",
  ],
  Quantity: [
    "quantity", "quantities", "qty", "qtys", "totalqty", "totalquantity",
    "recutquantity", "recutquantities", "recutqty", "recuttingqty",
    "recuttingquantity", "recutpieces", "pieces", "pcs", "noofpieces",
    "numberofpieces", "nopieces", "cutqty", "cutquantity", "rejectedqty",
    "rejectedquantity", "rejectqty", "rejectquantity", "reworkqty",
    "reworkquantity", "defectqty", "defectquantity", "count",
  ],
  "Reasons for recut": [
    "reasonsforrecut", "reasonforrecut", "reasonofrecut", "reasonrecut",
    "reasonrecutting", "reasonsforrecutting", "recutreason", "recutreasons",
    "recuttingreason", "reason", "reasons", "reasoncode", "cause",
    "rootcause", "defect", "defecttype", "defectcategory", "cuttingreason",
    "rejectreason", "rejectionreason", "reworkreason", "problem",
    "problemtype", "issue", "issuetype", "remark", "remarks", "comment",
    "comments",
  ],
};

const REQUIRED_COLUMNS = Object.keys(COLUMN_ALIASES) as (keyof typeof COLUMN_ALIASES)[];

// Minimum columns we need to consider parsing worthwhile — as low as
// possible: if we spot ONE canonical column we already tried our best.
const MIN_COLUMNS_TO_PARSE = 1;

function normalizeKey(value: unknown): string {
  if (value === undefined || value === null) return "";
  // Strip BOM, zero-width chars, non-breaking spaces, and parenthetical hints
  const cleaned = String(value)
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060\u00A0]/g, " ")
    .replace(/\([^)]*\)/g, " ");
  return cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function fuzzyMatchesAlias(headerKey: string, alias: string): boolean {
  if (!headerKey || !alias) return false;
  if (headerKey === alias) return true;
  // Substring — "workordernumber" in "cutworkordernumber"
  if (headerKey.length >= 4 && alias.length >= 4) {
    if (headerKey.includes(alias) || alias.includes(headerKey)) return true;
  }
  const longer = Math.max(headerKey.length, alias.length);
  if (longer <= 4) return false;
  const threshold = longer >= 10 ? 3 : longer >= 7 ? 2 : 1;
  return levenshtein(headerKey, alias) <= threshold;
}

function normalizeHeaderCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "")
    .replace(/[\u00A0]/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[\r\n\t]+/g, " ").trim();
}

function toNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  const cleaned = String(value).replace(/[^\d.\-]/g, "");
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const iso = new Date(Date.UTC(parsed.y, (parsed.m || 1) - 1, parsed.d || 1));
      return iso.toISOString().slice(0, 10);
    }
    return null;
  }
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [_, d1, d2, y] = m;
    if (y.length === 2) y = (parseInt(y) > 50 ? "19" : "20") + y;
    const iso = `${y}-${d2.padStart(2, "0")}-${d1.padStart(2, "0")}`;
    if (!isNaN(new Date(iso).getTime())) return iso;
  }
  return s;
}

interface HeaderCandidate {
  columnMap: Map<string, number>;
  headerRowIndex: number;
  dataRows: unknown[][];
  matchCount: number;
  sheetName: string;
}

function matchHeaderRow(rawRow: unknown[]): Map<string, number> {
  const normalized = rawRow.map(normalizeKey);
  const columnMap = new Map<string, number>();
  const usedIndices = new Set<number>();

  // Pass 1: exact alias match
  for (const canonical of REQUIRED_COLUMNS) {
    const aliases = COLUMN_ALIASES[canonical];
    for (let i = 0; i < normalized.length; i++) {
      if (usedIndices.has(i)) continue;
      const key = normalized[i];
      if (!key) continue;
      if (aliases.includes(key)) {
        columnMap.set(canonical, i);
        usedIndices.add(i);
        break;
      }
    }
  }

  // Pass 2: substring + fuzzy match for columns not yet mapped
  for (const canonical of REQUIRED_COLUMNS) {
    if (columnMap.has(canonical)) continue;
    const aliases = COLUMN_ALIASES[canonical];
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < normalized.length; i++) {
      if (usedIndices.has(i)) continue;
      const key = normalized[i];
      if (!key) continue;
      for (const alias of aliases) {
        if (fuzzyMatchesAlias(key, alias)) {
          const d = levenshtein(key, alias);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
      }
    }
    if (bestIdx !== -1) {
      columnMap.set(canonical, bestIdx);
      usedIndices.add(bestIdx);
    }
  }

  return columnMap;
}

// Try combining a header row with the next row (handles merged / two-line
// headers where labels split across two rows).
function combineRows(rowA: unknown[], rowB: unknown[]): unknown[] {
  const len = Math.max(rowA.length, rowB.length);
  const out: unknown[] = [];
  for (let i = 0; i < len; i++) {
    const a = normalizeHeaderCell(rowA[i]);
    const b = normalizeHeaderCell(rowB[i]);
    out.push([a, b].filter(Boolean).join(" ").trim());
  }
  return out;
}

function findBestHeaderCandidate(workbook: XLSX.WorkBook): HeaderCandidate | null {
  let best: HeaderCandidate | null = null;

  // Score = matchCount * 1000 + non-empty data rows below. This makes us
  // strongly prefer sheets that both recognise many columns AND actually
  // have data below the header.
  const scoreOf = (c: HeaderCandidate): number => {
    const dataRowCount = c.dataRows.filter((r) =>
      r.some((cell) => normalizeHeaderCell(cell) !== "")
    ).length;
    return c.matchCount * 1000 + Math.min(dataRowCount, 999);
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    // Scan every row — the header could be arbitrarily deep.
    for (let rowIndex = 0; rowIndex < aoa.length; rowIndex++) {
      const rawRow = aoa[rowIndex] ?? [];
      const singleMap = matchHeaderRow(rawRow);

      // Only try combining with the next row when the single row is a WEAK
      // match (<5 columns). This prevents us from mistakenly consuming a
      // data row as part of a two-line header.
      let combinedMap: Map<string, number> = new Map();
      if (singleMap.size < 5) {
        const nextRow = aoa[rowIndex + 1] ?? [];
        combinedMap = matchHeaderRow(combineRows(rawRow, nextRow));
      }

      const useCombined = combinedMap.size > singleMap.size + 1;
      const columnMap = useCombined ? combinedMap : singleMap;
      const matchCount = columnMap.size;
      if (matchCount === 0) continue;

      const dataStart = useCombined ? rowIndex + 2 : rowIndex + 1;
      const candidate: HeaderCandidate = {
        columnMap,
        headerRowIndex: rowIndex,
        dataRows: aoa.slice(dataStart),
        matchCount,
        sheetName,
      };
      if (!best || scoreOf(candidate) > scoreOf(best)) {
        best = candidate;
      }
      // Perfect match — but only return early if there IS data below.
      if (matchCount === REQUIRED_COLUMNS.length && candidate.dataRows.some((r) =>
        r.some((cell) => normalizeHeaderCell(cell) !== "")
      )) {
        return best;
      }
    }
  }
  return best;
}

// Detect HTML/XML "Excel" exports (common with Grid Frontline / older CMS
// report tools that save an HTML table with a .xls extension).
function looksLikeHtml(text: string): boolean {
  const t = text.trimStart().slice(0, 4096).toLowerCase();
  return (
    t.startsWith("<!doctype") ||
    t.startsWith("<html") ||
    t.startsWith("<meta") ||
    t.startsWith("<?xml") ||
    t.startsWith("<workbook") ||
    t.includes("<table")
  );
}

export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();

  // First, sniff whether this is really an HTML table saved as .xls / .xlsx.
  // If yes, feed it to XLSX.read as a string so its native HTML parser runs.
  let workbook: XLSX.WorkBook;
  try {
    const head = new TextDecoder("utf-8", { fatal: false }).decode(
      buffer.slice(0, 4096)
    );
    if (looksLikeHtml(head)) {
      const fullText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      workbook = XLSX.read(fullText, { type: "string", cellDates: true });
    } else {
      workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    }
  } catch {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  }

  if (workbook.SheetNames.length === 0) {
    return {
      rows: [],
      missingColumns: [...REQUIRED_COLUMNS],
      unmappedColumns: [...REQUIRED_COLUMNS],
      columnMapping: {},
    };
  }

  const candidate = findBestHeaderCandidate(workbook);

  // NEVER hard-fail — always return whatever we could parse.
  if (!candidate || candidate.matchCount === 0) {
    return {
      rows: [],
      missingColumns: [...REQUIRED_COLUMNS],
      unmappedColumns: [...REQUIRED_COLUMNS],
      columnMapping: {},
    };
  }

  const getCell = (row: unknown[], column: string): unknown => {
    const index = candidate.columnMap.get(column);
    return index === undefined ? "" : row[index];
  };

  // Pull the actual header row so we know each column's original label
  const sheetAoa = XLSX.utils.sheet_to_json<unknown[]>(
    workbook.Sheets[candidate.sheetName],
    { header: 1, defval: "", raw: true }
  );
  const headerRow = sheetAoa[candidate.headerRowIndex] ?? [];
  const originalHeaders: string[] = headerRow.map((h) => normalizeHeaderCell(h));

  // Keep EVERY non-empty raw row — never filter based on mapped fields alone.
  // Users get to see all rows in the data table even if some columns weren't
  // recognised.
  const rows: RecutRow[] = candidate.dataRows
    .filter((row) => row.some((cell) => normalizeHeaderCell(cell) !== ""))
    .map((row) => {
      const extra: Record<string, unknown> = {};
      for (let i = 0; i < row.length; i++) {
        const h = originalHeaders[i];
        if (!h) continue;
        // Skip cells that already power a canonical column
        const canonical = Array.from(candidate.columnMap.entries()).find(
          ([, idx]) => idx === i
        );
        if (canonical) continue;
        const raw = row[i];
        if (raw === "" || raw === null || raw === undefined) continue;
        extra[h] = raw;
      }
      return {
        date: normalizeDate(getCell(row, "Date")),
        factory: toText(getCell(row, "Factory")),
        workOrderNumber: toText(getCell(row, "Work_order_number")),
        line: toText(getCell(row, "Line")),
        product: toText(getCell(row, "Product")),
        parts: toText(getCell(row, "Parts")),
        size: toNumber(getCell(row, "Size")),
        quantity: toNumber(getCell(row, "Quantity")),
        reasonForRecut: toText(getCell(row, "Reasons for recut")),
        extra: Object.keys(extra).length > 0 ? extra : undefined,
      };
    });

  const unmapped = REQUIRED_COLUMNS.filter((c) => !candidate.columnMap.has(c));

  const columnMapping: Record<string, string> = {};
  candidate.columnMap.forEach((idx, canonical) => {
    columnMapping[canonical] = originalHeaders[idx] || canonical;
  });

  // Console diagnostics so ops teams / support can share what was detected.
  try {
    // eslint-disable-next-line no-console
    console.info("[Fabric Recut] parsed", {
      sheet: candidate.sheetName,
      headerRow: candidate.headerRowIndex + 1,
      mappedColumns: columnMapping,
      unmappedColumns: unmapped,
      rowsParsed: rows.length,
      allHeadersInFile: originalHeaders.filter(Boolean),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[Fabric Recut] diagnostics failed", err);
  }

  return {
    rows,
    missingColumns: [],
    unmappedColumns: unmapped,
    columnMapping,
    allHeaders: originalHeaders.filter(Boolean),
  };
}

export function buildTemplateWorkbook(): XLSX.WorkBook {
  const headers = [...REQUIRED_COLUMNS];
  const sampleRows = [
    ["2025-11-14", "Factory Alpha", "WO-1042", "Line-3", "Cotton Tee", "Front Panel", 42, 12, "Fabric defect"],
    ["2025-11-15", "Factory Beta", "WO-1050", "Line-1", "Denim Jeans", "Back Pocket", 38, 6, "Cutting error"],
    ["2025-11-15", "Factory Alpha", "WO-1042", "Line-3", "Cotton Tee", "Sleeve", 42, 4, "Shade variation"],
    ["2025-11-16", "Factory Gamma", "WO-1071", "Line-2", "Polo Shirt", "Collar", 40, 8, "Marker mismatch"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  worksheet["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 4) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Recut Data");
  return workbook;
}

export function downloadTemplate(): void {
  const wb = buildTemplateWorkbook();
  XLSX.writeFile(wb, "grid-frontline-recut-template.xlsx");
}

export { REQUIRED_COLUMNS };
