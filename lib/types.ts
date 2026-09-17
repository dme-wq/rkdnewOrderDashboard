// ============================================
// KARIGAR PRODUCTION DASHBOARD — TypeScript Types
// ============================================

export interface DataEntryRow {
  Date: string; // "yyyy-MM-dd"
  Day: string;
  "Buyer PO Number": string;
  "Natural Product Code": string;
  "Design Name": string;
  "Yarn Color": string;
  Size: string;
  "Name of Karigar 1": string; // "Name-PhoneNumber"
  Responsibility: string;
  "Total Production": string; // cumulative running counter
  "Factory Account": string;
  "Karigar Account (Pieces)": string;
  "Store Receiving (Pieces)": string;
}

export interface ProductionMasterRow {
  "Buyer PO Number": string;
  "Design Name": string;
  "Natural Product Code": string;
  "Yarn Color": string;
  Size: string;
  "PO Quantity (Pieces)": string;
  "Total Production to make (Pieces)": string;
  [key: string]: string;
}

export interface ApiResponse {
  success: boolean;
  dataEntry: DataEntryRow[];
  productionMaster: ProductionMasterRow[];
  lastUpdated: string;
  error?: string;
}

// Parsed karigar info
export interface KarigarInfo {
  fullRaw: string; // "Raman-7496828543"
  name: string; // "Raman"
  phone: string; // "7496828543"
}

// One processed row after delta computation
export interface ProcessedRow extends DataEntryRow {
  karigarInfo: KarigarInfo;
  dailyPiecesMade: number; // computed delta
  totalProductionNum: number; // parsed numeric
  poProgress: number; // 0–100 percent
  poTarget: number;
}

// Daily aggregated production
export interface DailyProduction {
  date: string; // "yyyy-MM-dd"
  totalPieces: number;
  byKarigar: Record<string, number>; // karigarName -> pieces
}

// Weekly aggregated production
export interface WeeklyProduction {
  weekLabel: string; // "W36 2026"
  weekStart: string;
  totalPieces: number;
}

// Karigar leaderboard entry
export interface KarigarStat {
  name: string;
  phone: string;
  fullRaw: string;
  totalPieces: number;
  rank: number;
  initials: string;
}

// Scorecard stats
export interface AggregatedStats {
  todayPieces: number;
  yesterdayPieces: number;
  thisWeekPieces: number;
  lastWeekPieces: number;
  thisMonthPieces: number;
  lastMonthPieces: number;
  thisQuarterPieces: number;
  lastQuarterPieces: number;
  allTimePieces: number;
  activeKarigars: number;
  dailyTrend: DailyProduction[]; // last 14 days
  weeklyTrend: WeeklyProduction[]; // last 8 weeks
  karigarLeaderboard: KarigarStat[];
}

// Active filters shape
export interface ActiveFilters {
  dateFrom: string;
  dateTo: string;
  poNumbers: string[];
  designNames: string[];
  yarnColors: string[];
  karigarNames: string[];
}

export type DatePreset = "today" | "thisWeek" | "thisMonth" | "thisQuarter" | "custom";
