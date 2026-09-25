// ============================================
// KARIGAR PRODUCTION DASHBOARD — Data Transform
// ============================================

import {
  DataEntryRow,
  ProductionMasterRow,
  ProcessedRow,
  KarigarInfo,
  DailyProduction,
  WeeklyProduction,
  KarigarStat,
  AggregatedStats,
  ActiveFilters,
} from "./types";
import {
  parseISO,
  parse,
  isValid,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  isWithinInterval,
  getISOWeek,
  getYear,
} from "date-fns";

// ─── Utilities ────────────────────────────────────────────────────────────────

export function parseKarigar(raw: string): KarigarInfo {
  const parts = raw.split("-");
  const phone = parts[parts.length - 1]?.trim() ?? "";
  const name = parts.slice(0, parts.length - 1).join("-").trim() || raw.trim();
  return { fullRaw: raw.trim(), name, phone };
}

function safeParseNum(val: string | number | undefined): number {
  if (val === undefined || val === null || val === "") return 0;
  const cleaned = String(val).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function safeParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try ISO format first: "yyyy-MM-dd" (e.g. from sheet raw values)
  const iso = parseISO(dateStr);
  if (isValid(iso)) return iso;
  // Try "dd-MMM-yyyy" format (e.g. "25-Sep-2026") — the normalized format
  const dmy = parse(dateStr, "dd-MMM-yyyy", new Date());
  if (isValid(dmy)) return dmy;
  // Try "d-MMM-yyyy" format (single digit day)
  const dmy2 = parse(dateStr, "d-MMM-yyyy", new Date());
  if (isValid(dmy2)) return dmy2;
  return null;
}

// ─── Step 1: Compute daily deltas ─────────────────────────────────────────────
// The Karigar Account (Pieces) column contains the actual daily pieces made.
// Google Sheet wrapped headers may come as "Karigar Account\n(Pieces)" or
// "Karigar Account (Pieces)" — we handle both.

// Lookup a column value, trying multiple key variants (handles newline-wrapped headers)
function getColValue(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const val = (row as Record<string, string>)[key];
    if (val !== undefined && val !== null) return val;
  }
  return "";
}

export function computeDailyDelta(
  rows: DataEntryRow[],
  masterRows: ProductionMasterRow[]
): ProcessedRow[] {
  // Build PO target lookup
  const poTargetMap = new Map<string, number>();
  for (const m of masterRows) {
    const key = m["Natural Product Code"]?.trim();
    if (key) {
      poTargetMap.set(key, safeParseNum(m["Total Production to make (Pieces)"]));
    }
  }

  const processed: ProcessedRow[] = [];
  for (const row of rows) {
    // Skip completely empty/dropdown-default rows from Google Sheets
    const hasDate = row.Date && row.Date.trim() !== "";
    const hasKarigar = row["Name of Karigar 1"] && row["Name of Karigar 1"].trim() !== "";
    const hasPO = row["Buyer PO Number"] && row["Buyer PO Number"].trim() !== "";
    if (!hasDate && !hasKarigar && !hasPO) continue;

    const currentTotal = safeParseNum(row["Total Production"]);
    // Use the explicit Karigar Account column as the daily pieces
    // Try multiple key variants to handle wrapped header cells in Google Sheets
    const karigarAcctRaw = getColValue(
      row as unknown as Record<string, string>,
      "Karigar Account (Pieces)",
      "Karigar Account\n(Pieces)",
      "Karigar Account(Pieces)"
    );
    const dailyPiecesMade = safeParseNum(karigarAcctRaw);

    const product = row["Natural Product Code"]?.trim() ?? "";
    const poTarget = poTargetMap.get(product) ?? 0;
    const poProgress = poTarget > 0 ? Math.min(100, (currentTotal / poTarget) * 100) : 0;

    let rowDateStr = row.Date;
    // Standardize row.Date format to dd-MMM-yyyy if it is a valid date
    const parsedD = safeParseDate(row.Date);
    if (parsedD) {
      rowDateStr = format(parsedD, "dd-MMM-yyyy");
    }

    processed.push({
      ...row,
      Date: rowDateStr, // Override Date with the standardized format
      karigarInfo: parseKarigar(row["Name of Karigar 1"] ?? ""),
      dailyPiecesMade,
      totalProductionNum: currentTotal,
      poProgress: Math.round(poProgress * 10) / 10,
      poTarget,
    });
  }

  // Sort overall processed by Date (descending or ascending) if needed, 
  // but they are usually chronological from the sheet.
  return processed;
}

// ─── Step 2: Filter processed rows by active filters ──────────────────────────

export function applyFilters(
  rows: ProcessedRow[],
  filters: ActiveFilters
): ProcessedRow[] {
  return rows.filter((row) => {
    const rowDate = safeParseDate(row.Date);

    // Date range
    if (filters.dateFrom && filters.dateTo && rowDate) {
      const from = safeParseDate(filters.dateFrom);
      const to = safeParseDate(filters.dateTo);
      if (from && to && !isWithinInterval(rowDate, { start: from, end: to })) return false;
    }

    // PO Numbers
    if (filters.poNumbers.length > 0 && !filters.poNumbers.includes(row["Buyer PO Number"]?.trim())) return false;

    // Design names
    if (filters.designNames.length > 0 && !filters.designNames.includes(row["Design Name"]?.trim())) return false;

    // Yarn colors
    if (filters.yarnColors.length > 0 && !filters.yarnColors.includes(row["Yarn Color"]?.trim())) return false;

    // Karigar names
    if (filters.karigarNames.length > 0 && !filters.karigarNames.includes(row.karigarInfo.name)) return false;

    return true;
  });
}

// ─── Step 3: Aggregate by period ──────────────────────────────────────────────

function getTodayStr(): string {
  return format(new Date(), "dd-MMM-yyyy");
}

function getYesterdayStr(): string {
  return format(subDays(new Date(), 1), "dd-MMM-yyyy");
}

export function aggregateStats(processedRows: ProcessedRow[]): AggregatedStats {
  const now = new Date();
  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();

  // Periods
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const thisQuarterStart = startOfQuarter(now);
  const lastQuarterStart = startOfQuarter(subQuarters(now, 1));
  const lastQuarterEnd = endOfQuarter(subQuarters(now, 1));

  let todayPieces = 0;
  let yesterdayPieces = 0;
  let thisWeekPieces = 0;
  let lastWeekPieces = 0;
  let thisMonthPieces = 0;
  let lastMonthPieces = 0;
  let thisQuarterPieces = 0;
  let lastQuarterPieces = 0;

  // All-time: MAX(Total Production) per (karigar+product) group
  const maxByGroup = new Map<string, number>();
  const activeKarigarSet = new Set<string>();

  // Daily trend (last 14 days)
  const dailyMap = new Map<string, { total: number; byKarigar: Record<string, number> }>();
  for (let i = 13; i >= 0; i--) {
    const d = format(subDays(now, i), "dd-MMM-yyyy");
    dailyMap.set(d, { total: 0, byKarigar: {} });
  }

  // Weekly trend (last 8 weeks)
  const weeklyMap = new Map<string, { total: number; weekStart: string }>();
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const label = `W${getISOWeek(ws)} ${getYear(ws)}`;
    weeklyMap.set(label, { total: 0, weekStart: format(ws, "yyyy-MM-dd") });
  }

  // Karigar leaderboard
  const karigarTotals = new Map<string, { name: string; phone: string; fullRaw: string; total: number }>();

  for (const row of processedRows) {
    const pieces = row.dailyPiecesMade;
    const rowDate = safeParseDate(row.Date);
    const dateStr = row.Date;
    const groupKey = `${row["Name of Karigar 1"]?.trim()}||${row["Natural Product Code"]?.trim()}`;
    const karigarName = row.karigarInfo.name;

    // Update max by group for all-time total
    const prev = maxByGroup.get(groupKey) ?? 0;
    maxByGroup.set(groupKey, Math.max(prev, row.totalProductionNum));

    // Active karigars
    if (pieces > 0) activeKarigarSet.add(karigarName);

    // Karigar totals for leaderboard
    const existing = karigarTotals.get(karigarName);
    if (existing) {
      existing.total += pieces;
    } else {
      karigarTotals.set(karigarName, {
        name: karigarName,
        phone: row.karigarInfo.phone,
        fullRaw: row.karigarInfo.fullRaw,
        total: pieces,
      });
    }

    if (!rowDate) continue;

    // Today / Yesterday
    if (dateStr === todayStr) todayPieces += pieces;
    if (dateStr === yesterdayStr) yesterdayPieces += pieces;

    // This week
    if (rowDate >= thisWeekStart) thisWeekPieces += pieces;

    // Last week
    if (isWithinInterval(rowDate, { start: lastWeekStart, end: lastWeekEnd })) lastWeekPieces += pieces;

    // This month
    if (rowDate >= thisMonthStart) thisMonthPieces += pieces;

    // Last month
    if (isWithinInterval(rowDate, { start: lastMonthStart, end: lastMonthEnd })) lastMonthPieces += pieces;

    // This quarter
    if (rowDate >= thisQuarterStart) thisQuarterPieces += pieces;

    // Last quarter
    if (isWithinInterval(rowDate, { start: lastQuarterStart, end: lastQuarterEnd })) lastQuarterPieces += pieces;

    // Daily trend
    // If the Date from row matches our formatted dd-MMM-yyyy, or if we can parse it
    // Wait, row.Date is already normalized to dd-MMM-yyyy by computeDailyDelta!
    if (dailyMap.has(dateStr)) {
      const entry = dailyMap.get(dateStr)!;
      entry.total += pieces;
      entry.byKarigar[karigarName] = (entry.byKarigar[karigarName] ?? 0) + pieces;
    }

    // Weekly trend
    const ws = startOfWeek(rowDate, { weekStartsOn: 1 });
    const weekLabel = `W${getISOWeek(ws)} ${getYear(ws)}`;
    if (weeklyMap.has(weekLabel)) {
      weeklyMap.get(weekLabel)!.total += pieces;
    }
  }

  // All-time total
  let allTimePieces = 0;
  for (const val of maxByGroup.values()) allTimePieces += val;

  // Build daily trend array
  const dailyTrend: DailyProduction[] = [];
  for (const [date, data] of dailyMap) {
    dailyTrend.push({ date, totalPieces: data.total, byKarigar: data.byKarigar });
  }

  // Build weekly trend array
  const weeklyTrend: WeeklyProduction[] = [];
  for (const [weekLabel, data] of weeklyMap) {
    weeklyTrend.push({ weekLabel, weekStart: data.weekStart, totalPieces: data.total });
  }

  // Build karigar leaderboard
  const karigarLeaderboard: KarigarStat[] = Array.from(karigarTotals.values())
    .sort((a, b) => b.total - a.total)
    .map((k, i) => ({
      name: k.name,
      phone: k.phone,
      fullRaw: k.fullRaw,
      totalPieces: k.total,
      rank: i + 1,
      initials: k.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    }));

  return {
    todayPieces,
    yesterdayPieces,
    thisWeekPieces,
    lastWeekPieces,
    thisMonthPieces,
    lastMonthPieces,
    thisQuarterPieces,
    lastQuarterPieces,
    allTimePieces,
    activeKarigars: activeKarigarSet.size,
    dailyTrend,
    weeklyTrend,
    karigarLeaderboard,
  };
}

// ─── Step 4: Date preset helpers ──────────────────────────────────────────────

export function getDateRangeForPreset(preset: string): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  switch (preset) {
    case "today":
      return { from: fmt(now), to: fmt(now) };
    case "thisWeek":
      return { from: fmt(startOfWeek(now, { weekStartsOn: 1 })), to: fmt(now) };
    case "thisMonth":
      return { from: fmt(startOfMonth(now)), to: fmt(now) };
    case "thisQuarter":
      return { from: fmt(startOfQuarter(now)), to: fmt(now) };
    default:
      return { from: "", to: "" };
  }
}

// ─── Step 5: CSV export ───────────────────────────────────────────────────────

export function exportToCSV(rows: ProcessedRow[]): void {
  const headers = [
    "Buyer PO Number",
    "Natural Product Code",
    "Design Name",
    "Yarn Color",
    "Size",
    "Karigar Name",
    "Phone",
    "Responsibility",
    "Daily Pieces Made",
    "Total Production (Cumulative)",
    "Karigar Account (Pieces)",
    "Store Receiving (Pieces)",
    "PO Target",
    "% PO Target Achieved",
    "Date",
  ];

  const csvRows = rows.map((r) => [
    r["Buyer PO Number"],
    r["Natural Product Code"],
    r["Design Name"],
    r["Yarn Color"],
    r.Size,
    r.karigarInfo.name,
    r.karigarInfo.phone,
    r.Responsibility,
    r.dailyPiecesMade,
    r.totalProductionNum,
    r["Karigar Account (Pieces)"],
    r["Store Receiving (Pieces)"],
    r.poTarget,
    r.poProgress + "%",
    r.Date,
  ]);

  const content = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `karigar-production-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
