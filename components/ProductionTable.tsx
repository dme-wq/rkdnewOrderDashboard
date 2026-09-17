"use client";

import { ProcessedRow, ActiveFilters, DatePreset } from "@/lib/types";
import { exportToCSV, getDateRangeForPreset } from "@/lib/transform";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ArrowLeft,
  ArrowRight,
  PackageOpen,
  Filter,
  Check,
  Calendar,
  X
} from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";

interface ProductionTableProps {
  rows: ProcessedRow[];
  allRows: ProcessedRow[];
  filters: ActiveFilters;
  onFiltersChange: (f: ActiveFilters) => void;
  isLoading: boolean;
}

type SortKey = keyof ProcessedRow | "poProgress";
type SortDir = "asc" | "desc" | "none";

const PAGE_SIZES = [20, 50, 100];
const DATE_PRESETS: { label: string; value: DatePreset | "custom" }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Qtr", value: "thisQuarter" },
  { label: "Custom", value: "custom" },
];

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp size={13} className="text-primary" />;
  if (dir === "desc") return <ChevronDown size={13} className="text-primary" />;
  return <ChevronsUpDown size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// ── Smart Column Filter ──────────────────────────────────────────────────────

interface SmartFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

function SmartFilter({ label, options, selected, onChange }: SmartFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((s) => s !== val));
    else onChange([...selected, val]);
  };

  const isActive = selected.length > 0;

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all border ${
          isActive || open 
            ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" 
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {label}
        {isActive && (
          <span className="bg-black/20 text-white text-[9px] font-bold px-1.5 rounded-full min-w-[16px] text-center">
            {selected.length}
          </span>
        )}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-[100] min-w-[200px] max-h-64 overflow-y-auto
          rounded-xl border border-gray-200 bg-white shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1
          cursor-default font-normal text-[13px] tracking-normal normal-case"
          onClick={(e) => e.stopPropagation()}
        >
          {options.length === 0 && (
            <div className="px-4 py-2 text-muted-foreground">No options</div>
          )}
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-[4px] flex flex-shrink-0 items-center justify-center border transition-colors ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>
                <span className="truncate text-foreground">{opt}</span>
              </label>
            );
          })}
          {options.length > 0 && (
            <div className="sticky bottom-0 bg-card/90 backdrop-blur-sm border-t border-border p-2 mt-1">
              <button
                onClick={() => onChange([])}
                disabled={!isActive}
                className="w-full py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors rounded-md hover:bg-muted/50"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Table Component ─────────────────────────────────────────────────────

export function ProductionTable({ rows, allRows, filters, onFiltersChange, isLoading }: ProductionTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("none");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activePreset, setActivePreset] = useState<DatePreset | "custom" | "">("");

  // Extract unique values for filters from ALL rows (not just filtered ones)
  const uniqueVals = useMemo(() => {
    const poSet = new Set<string>();
    const designSet = new Set<string>();
    const colorSet = new Set<string>();
    const karigarSet = new Set<string>();

    for (const row of allRows) {
      if (row["Buyer PO Number"]) poSet.add(row["Buyer PO Number"].trim());
      if (row["Design Name"]) designSet.add(row["Design Name"].trim());
      if (row["Yarn Color"]) colorSet.add(row["Yarn Color"].trim());
      if (row.karigarInfo?.name) karigarSet.add(row.karigarInfo.name);
    }

    return {
      poNumbers: [...poSet].sort(),
      designNames: [...designSet].sort(),
      yarnColors: [...colorSet].sort(),
      karigarNames: [...karigarSet].sort(),
    };
  }, [allRows]);

  // Search filter
  const searchedRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r["Buyer PO Number"]?.toLowerCase().includes(q) ||
        r["Natural Product Code"]?.toLowerCase().includes(q) ||
        r["Design Name"]?.toLowerCase().includes(q) ||
        r.karigarInfo.name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Sort
  const sortedRows = useMemo(() => {
    if (!sortKey || sortDir === "none") return searchedRows;
    return [...searchedRows].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortKey === "poProgress") {
        aVal = a.poProgress;
        bVal = b.poProgress;
      } else if (sortKey === "dailyPiecesMade") {
        aVal = a.dailyPiecesMade;
        bVal = b.dailyPiecesMade;
      } else if (sortKey === "Total Production") {
        aVal = a.totalProductionNum;
        bVal = b.totalProductionNum;
      } else {
        aVal = String(a[sortKey as keyof ProcessedRow] ?? "").toLowerCase();
        bVal = String(b[sortKey as keyof ProcessedRow] ?? "").toLowerCase();
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [searchedRows, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  // Pagination bounds check on data changes
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);


  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? "none" : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key as SortKey);
      setSortDir("asc");
    }
    setPage(1);
  };

  const applyPreset = (preset: DatePreset | "custom") => {
    setActivePreset(preset);
    if (preset !== "custom") {
      const { from, to } = getDateRangeForPreset(preset);
      onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
    }
  };

  const clearFilters = () => {
    setActivePreset("");
    setSearch("");
    onFiltersChange({
      dateFrom: "",
      dateTo: "",
      poNumbers: [],
      designNames: [],
      yarnColors: [],
      karigarNames: [],
    });
  };

  const activeFiltersCount = [
    filters.poNumbers.length,
    filters.designNames.length,
    filters.yarnColors.length,
    filters.karigarNames.length,
    filters.dateFrom ? 1 : 0,
    search.trim() ? 1 : 0
  ].reduce((a, b) => a + b, 0);


  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col w-full overflow-hidden mb-6">
      
      {/* ── Modern Unified Toolbar ── */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-20 relative bg-white">
        
        {/* Left: Search & Global Actions */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative group max-w-sm w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search PO, Design, Karigar..."
              className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-900
                placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
            />
          </div>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all animate-in fade-in"
            >
              <X size={14} /> Clear {activeFiltersCount}
            </button>
          )}
        </div>

        {/* Right: Date Presets & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-gray-100/80 rounded-lg border border-gray-200/60 gap-1 overflow-x-auto max-w-[280px] sm:max-w-full hide-scrollbar">
            <Calendar size={13} className="text-muted-foreground/70 mx-2 flex-shrink-0" />
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all outline-none whitespace-nowrap flex-shrink-0 ${
                  activePreset === p.value
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => exportToCSV(sortedRows)}
            disabled={sortedRows.length === 0}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
            title="Export CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      
      {/* ── Smart Dynamic Dependent Filters (Above Table) ── */}
      <div className="px-5 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 mr-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
          <Filter size={14} className="text-gray-500" /> Filters
        </div>
        <SmartFilter
          label="PO Number"
          options={uniqueVals.poNumbers}
          selected={filters.poNumbers}
          onChange={(v) => onFiltersChange({ ...filters, poNumbers: v })}
        />
        <SmartFilter
          label="Design"
          options={uniqueVals.designNames}
          selected={filters.designNames}
          onChange={(v) => onFiltersChange({ ...filters, designNames: v })}
        />
        <SmartFilter
          label="Color"
          options={uniqueVals.yarnColors}
          selected={filters.yarnColors}
          onChange={(v) => onFiltersChange({ ...filters, yarnColors: v })}
        />
        <SmartFilter
          label="Karigar"
          options={uniqueVals.karigarNames}
          selected={filters.karigarNames}
          onChange={(v) => onFiltersChange({ ...filters, karigarNames: v })}
        />
      </div>

      {/* ── Custom Date Picker (if active) ── */}
      {activePreset === "custom" && (
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <span className="text-[13px] font-medium text-muted-foreground">Select Range:</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-1.5 rounded-md text-[13px] border border-gray-200 bg-white shadow-sm text-gray-900 focus:outline-none focus:border-blue-400"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            className="px-3 py-1.5 rounded-md text-[13px] border border-gray-200 bg-white shadow-sm text-gray-900 focus:outline-none focus:border-blue-400"
          />
        </div>
      )}

      {/* ── Modern Table ── */}
      <div className="overflow-auto relative w-full flex-1 max-h-[500px]">
        <table className="w-full text-sm border-collapse min-w-[1100px]">
          <thead className="bg-white sticky top-0 z-10 border-b border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <tr>
              <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-16 ">#</th>
              
              {/* Date */}
              <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-32  group select-none">
                <div className="flex items-center gap-1.5">
                  <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("Date")}>
                    Date
                  </span>
                  <SortIcon dir={sortKey === "Date" ? sortDir : "none"} />
                </div>
              </th>

              {/* PO Number */}
              <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-36  group select-none">
                <div className="flex items-center gap-1.5">
                  <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("Buyer PO Number")}>
                    PO Number
                  </span>
                  <SortIcon dir={sortKey === "Buyer PO Number" ? sortDir : "none"} />
                </div>
              </th>

              {/* Design */}
              <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider min-w-[200px]  group select-none">
                <div className="flex items-center gap-1.5">
                  <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("Design Name")}>
                    Design
                  </span>
                  <SortIcon dir={sortKey === "Design Name" ? sortDir : "none"} />
                </div>
              </th>

              {/* Color */}
              <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-32  group select-none">
                <div className="flex items-center gap-1.5">
                  <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("Yarn Color")}>
                    Color
                  </span>
                  <SortIcon dir={sortKey === "Yarn Color" ? sortDir : "none"} />
                </div>
              </th>

              {/* Size */}
              <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-32 ">
                Size
              </th>

              {/* Karigar */}
              <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider min-w-[180px]  group select-none">
                <div className="flex items-center gap-1.5">
                  <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("Name of Karigar 1")}>
                    Karigar
                  </span>
                  <SortIcon dir={sortKey === "Name of Karigar 1" ? sortDir : "none"} />
                </div>
              </th>

              {/* Daily Delta */}
              <th className="pl-5 pr-12 py-4 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider min-w-[140px] border-b border-border/50 cursor-pointer hover:text-foreground group select-none" onClick={() => handleSort("dailyPiecesMade")}>
                <div className="flex items-center justify-end gap-1.5">
                  <SortIcon dir={sortKey === "dailyPiecesMade" ? sortDir : "none"} />
                  Daily Δ
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && paginatedRows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <PackageOpen size={32} className="opacity-40" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">No records found</p>
                      <p className="text-[13px] opacity-70 mt-1">Try adjusting your filters or search query</p>
                    </div>
                    {activeFiltersCount > 0 && (
                      <button onClick={clearFilters} className="mt-2 text-[13px] font-medium text-primary hover:underline">
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedRows.map((row, idx) => (
                <tr
                  key={`${row["Buyer PO Number"]}-${row.karigarInfo.fullRaw}-${row.Date}-${idx}`}
                  className="group transition-colors hover:bg-gray-50/80 border-b border-gray-100 last:border-0"
                >
                  <td className="px-5 py-4 text-[13px] text-gray-500 tabular-nums">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  
                  {/* Date */}
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[13px] font-medium text-gray-800 whitespace-nowrap">
                      {formatDate(row.Date)}
                    </span>
                  </td>
                  
                  {/* PO */}
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[13px] font-medium text-gray-900">
                      {row["Buyer PO Number"]}
                    </span>
                  </td>
                  
                  {/* Design */}
                  <td className="px-5 py-4 align-middle max-w-[140px]">
                    <span className="text-[13.5px] font-medium text-gray-900 truncate block">{row["Design Name"]}</span>
                  </td>
                  
                  {/* Color */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-border/80 flex-shrink-0 shadow-inner"
                        style={{ background: row["Yarn Color"]?.toLowerCase() === "white" ? "#f8fafc" : row["Yarn Color"]?.toLowerCase() }}
                      />
                      <span className="text-[13px]">{row["Yarn Color"]}</span>
                    </div>
                  </td>
                  
                  {/* Size */}
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[12px] font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-md">{row.Size}</span>
                  </td>
                  
                  {/* Karigar */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
                        {row.karigarInfo.name.substring(0,2)}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-medium text-gray-900 leading-tight">{row.karigarInfo.name}</p>
                        <p className="text-[11px] text-gray-500">{row.karigarInfo.phone}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Daily Delta */}
                  <td className="pl-5 pr-12 py-4 align-middle text-right">
                    <div className={`inline-flex items-center gap-1 text-[12px] font-bold tabular-nums px-2.5 py-1 rounded-full border ${row.dailyPiecesMade > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
                      {row.dailyPiecesMade > 0 && <ChevronUp size={12} strokeWidth={3} />}
                      {row.dailyPiecesMade > 0 ? row.dailyPiecesMade : "-"}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Modern Pagination ── */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-200 bg-white gap-4">
          
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-gray-500">
              Showing <span className="font-semibold text-gray-900">{(page - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * pageSize, sortedRows.length)}</span> of <span className="font-semibold text-gray-900">{sortedRows.length}</span>
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-[12px] font-medium border border-gray-200 bg-white text-gray-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:bg-gray-50"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <ArrowLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-md text-[13px] font-semibold transition-all border ${
                    p === page
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
