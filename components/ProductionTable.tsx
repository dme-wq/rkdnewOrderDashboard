"use client";

import { ProcessedRow, ActiveFilters, DatePreset } from "@/lib/types";
import { exportToCSV, getDateRangeForPreset } from "@/lib/transform";
import {
  Search, Download, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, PackageOpen, Check, CalendarRange,
  X, Filter, ArrowUpDown, SlidersHorizontal,
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

const PAGE_SIZES = [10, 20, 50, 100];
const DATE_PRESETS: { label: string; value: DatePreset | "custom" }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Qtr", value: "thisQuarter" },
  { label: "Custom", value: "custom" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "linear-gradient(135deg,#3730a3,#6366f1)", text: "#fff" },
  { bg: "linear-gradient(135deg,#5b21b6,#8b5cf6)", text: "#fff" },
  { bg: "linear-gradient(135deg,#065f46,#059669)", text: "#fff" },
  { bg: "linear-gradient(135deg,#1e40af,#3b82f6)", text: "#fff" },
  { bg: "linear-gradient(135deg,#92400e,#d97706)", text: "#fff" },
  { bg: "linear-gradient(135deg,#9d174d,#ec4899)", text: "#fff" },
  { bg: "linear-gradient(135deg,#164e63,#06b6d4)", text: "#fff" },
  { bg: "linear-gradient(135deg,#7f1d1d,#ef4444)", text: "#fff" },
];

const PO_COLORS = [
  { bg: "rgba(99,102,241,0.12)", text: "#6366f1", border: "rgba(99,102,241,0.25)" },
  { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", border: "rgba(139,92,246,0.25)" },
  { bg: "rgba(5,150,105,0.12)",  text: "#059669", border: "rgba(5,150,105,0.25)"  },
  { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  { bg: "rgba(217,119,6,0.12)",  text: "#d97706", border: "rgba(217,119,6,0.25)"  },
  { bg: "rgba(236,72,153,0.12)", text: "#ec4899", border: "rgba(236,72,153,0.25)" },
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

function getAvatarColor(name: string) {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
}
function getPoColor(po: string) {
  return PO_COLORS[hashStr(po) % PO_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}
function formatDate(d: string) {
  const months: Record<string, string> = {
    Jan:"Jan",Feb:"Feb",Mar:"Mar",Apr:"Apr",May:"May",Jun:"Jun",
    Jul:"Jul",Aug:"Aug",Sep:"Sep",Oct:"Oct",Nov:"Nov",Dec:"Dec",
  };
  const parts = d.split("-");
  if (parts.length === 3) {
    // dd-MMM-yyyy
    if (isNaN(Number(parts[1]))) return `${parts[0]} ${months[parts[1]] ?? parts[1]}`;
    // yyyy-MM-dd
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    }
  }
  return d;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow({ i }: { i: number }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
      {[48, 90, 110, 200, 100, 90, 180, 90].map((w, j) => (
        <td key={j} style={{ padding: "14px 16px" }}>
          <div className="skeleton" style={{
            height: j === 6 ? 28 : 13, width: `${w * (0.5 + (i * j % 5) * 0.1)}px`,
            maxWidth: "100%", borderRadius: j === 6 ? 99 : 5,
          }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp size={12} strokeWidth={2.5} style={{ color: "#6366f1" }} />;
  if (dir === "desc") return <ChevronDown size={12} strokeWidth={2.5} style={{ color: "#6366f1" }} />;
  return <ChevronsUpDown size={11} strokeWidth={2} style={{ color: "var(--text-muted)", opacity: 0.5 }} />;
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function MultiSelectDropdown({
  label, options, selected, onChange, icon: Icon,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };

  const activeCount = selected.length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "6px 11px", borderRadius: 8,
          border: activeCount > 0 ? "1.5px solid rgba(99,102,241,0.40)" : "1px solid var(--border)",
          background: activeCount > 0 ? "rgba(99,102,241,0.08)" : "var(--bg-elevated)",
          color: activeCount > 0 ? "#6366f1" : "var(--text-secondary)",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          transition: "all 0.15s ease",
        }}
      >
        {Icon && <Icon size={12} />}
        {label}
        {activeCount > 0 && (
          <span style={{
            background: "#6366f1", color: "#fff", borderRadius: 99,
            padding: "1px 6px", fontSize: 10, fontWeight: 700, lineHeight: "14px",
          }}>{activeCount}</span>
        )}
        <ChevronDown size={11} style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12, padding: 6,
          minWidth: 200, maxHeight: 260, overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08)",
          backdropFilter: "blur(12px)",
        }}>
          {options.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)" }}>No options</div>
          ) : (
            options.map(opt => (
              <div
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                  fontSize: 12, fontWeight: 500,
                  background: selected.includes(opt) ? "rgba(99,102,241,0.08)" : "transparent",
                  color: selected.includes(opt) ? "#6366f1" : "var(--text-primary)",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={e => { if (!selected.includes(opt)) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected.includes(opt) ? "rgba(99,102,241,0.08)" : "transparent"; }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 5,
                  border: selected.includes(opt) ? "none" : "1.5px solid var(--border)",
                  background: selected.includes(opt) ? "#6366f1" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.12s ease",
                }}>
                  {selected.includes(opt) && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ProductionTable({ rows, allRows, filters, onFiltersChange, isLoading }: ProductionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("Date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState<DatePreset | "custom" | null>(null);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Unique filter options
  const poOptions = useMemo(() => [...new Set(allRows.map(r => r["Buyer PO Number"]).filter(Boolean))].sort(), [allRows]);
  const designOptions = useMemo(() => [...new Set(allRows.map(r => r["Design Name"]).filter(Boolean))].sort(), [allRows]);
  const colorOptions = useMemo(() => [...new Set(allRows.map(r => r["Yarn Color"]).filter(Boolean).filter(c => c !== "-"))].sort(), [allRows]);
  const karigarOptions = useMemo(() => [...new Set(allRows.map(r => r.karigarInfo.name).filter(Boolean))].sort(), [allRows]);

  const isFiltered =
    !!(filters.dateFrom || filters.poNumbers.length || filters.designNames.length ||
      filters.yarnColors.length || filters.karigarNames.length) || !!searchQuery;

  // Search
  const searchedRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(r =>
      r["Buyer PO Number"]?.toLowerCase().includes(q) ||
      r["Design Name"]?.toLowerCase().includes(q) ||
      r.karigarInfo.name?.toLowerCase().includes(q) ||
      r["Yarn Color"]?.toLowerCase().includes(q) ||
      r["Size"]?.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  // Sort
  const sortedRows = useMemo(() => {
    if (sortDir === "none") return searchedRows;
    return [...searchedRows].sort((a, b) => {
      let av: unknown = a[sortKey as keyof ProcessedRow];
      let bv: unknown = b[sortKey as keyof ProcessedRow];
      if (sortKey === "dailyPiecesMade" || sortKey === "totalProductionNum" || sortKey === "poProgress") {
        av = Number(av) || 0; bv = Number(bv) || 0;
        return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
      }
      av = String(av ?? ""); bv = String(bv ?? "");
      return sortDir === "asc"
        ? (av as string).localeCompare(bv as string)
        : (bv as string).localeCompare(av as string);
    });
  }, [searchedRows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const grandTotal = useMemo(() => searchedRows.reduce((s, r) => s + r.dailyPiecesMade, 0), [searchedRows]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : d === "desc" ? "none" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const applyPreset = (preset: DatePreset | "custom") => {
    setPage(1);
    if (preset === "custom") {
      setActivePreset("custom");
      setShowCustomDate(true);
      return;
    }
    setShowCustomDate(false);
    const { from, to } = getDateRangeForPreset(preset);
    setActivePreset(preset);
    onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
  };

  const clearPreset = () => {
    setActivePreset(null);
    setShowCustomDate(false);
    onFiltersChange({ ...filters, dateFrom: "", dateTo: "" });
  };

  const clearAll = () => {
    setActivePreset(null);
    setShowCustomDate(false);
    setSearchQuery("");
    onFiltersChange({ dateFrom: "", dateTo: "", poNumbers: [], designNames: [], yarnColors: [], karigarNames: [] });
    setPage(1);
  };

  // Styles
  const thBase: React.CSSProperties = {
    padding: "11px 14px",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
    letterSpacing: "0.02em",
    color: "var(--text-primary)",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
    userSelect: "none",
    position: "sticky",
    top: 0,
    zIndex: 10,
    textAlign: "center",
  };
  const thSortable: React.CSSProperties = { ...thBase, cursor: "pointer" };
  const thRight: React.CSSProperties = { ...thBase, textAlign: "center" };
  const thSortRight: React.CSSProperties = { ...thSortable, textAlign: "center" };

  const tdBase: React.CSSProperties = {
    padding: "12px 14px",
    borderBottom: "1px solid var(--border-light)",
    fontSize: 13,
    color: "var(--text-primary)",
    verticalAlign: "middle",
    textAlign: "center",
  };

  const pageNums = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 18,
      border: "1px solid var(--border)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* Row 1: Search + Export */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            />
            <input
              id="table-search"
              type="text"
              placeholder="Search PO, Design, Karigar, Color…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              style={{
                width: "100%", paddingLeft: 34, paddingRight: searchQuery ? 30 : 12,
                paddingTop: 8, paddingBottom: 8,
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 13, fontFamily: "Inter, sans-serif",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => {
                e.target.style.borderColor = "rgba(99,102,241,0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.10)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setPage(1); }}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 2,
                  color: "var(--text-muted)", display: "flex",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Record count badge */}
          <div style={{
            padding: "5px 12px", borderRadius: 8,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            fontSize: 12, fontWeight: 700,
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
          }}>
            {sortedRows.length.toLocaleString()} records
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Clear all */}
          {isFiltered && (
            <button
              id="table-clear-filters"
              onClick={clearAll}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 11px", borderRadius: 8,
                border: "1px solid rgba(225,29,72,0.25)",
                background: "rgba(225,29,72,0.06)",
                color: "#e11d48", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(225,29,72,0.10)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(225,29,72,0.06)"}
            >
              <X size={12} /> Clear All
            </button>
          )}

          {/* Export */}
          <button
            id="table-export"
            onClick={() => exportToCSV(sortedRows)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9,
              background: "linear-gradient(135deg,#3730a3,#6366f1)",
              color: "#fff", border: "none",
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
              boxShadow: "0 2px 10px rgba(99,102,241,0.30)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.45)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(99,102,241,0.30)"}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>

        {/* Row 2: Date presets + Column filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Date preset pills */}
          <div style={{
            display: "flex", alignItems: "center",
            background: "var(--bg-elevated)",
            borderRadius: 10, padding: 3,
            border: "1px solid var(--border)",
            gap: 2,
          }}>
            {DATE_PRESETS.map(p => (
              <button
                key={p.value}
                id={`preset-${p.value}`}
                onClick={() => activePreset === p.value ? clearPreset() : applyPreset(p.value)}
                style={{
                  padding: "5px 11px", borderRadius: 7,
                  border: "none", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  letterSpacing: "-0.01em",
                  transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                  background: activePreset === p.value ? "#6366f1" : "transparent",
                  color: activePreset === p.value ? "#fff" : "var(--text-secondary)",
                  boxShadow: activePreset === p.value ? "0 2px 8px rgba(99,102,241,0.35)" : "none",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {showCustomDate && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
              }}>
                <CalendarRange size={12} color="var(--text-muted)" />
                <input
                  type="date" value={filters.dateFrom}
                  onChange={e => { onFiltersChange({ ...filters, dateFrom: e.target.value }); setPage(1); }}
                  style={{ border: "none", background: "transparent", fontSize: 12, color: "var(--text-primary)", outline: "none", fontFamily: "Inter, sans-serif" }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>→</span>
                <input
                  type="date" value={filters.dateTo}
                  onChange={e => { onFiltersChange({ ...filters, dateTo: e.target.value }); setPage(1); }}
                  style={{ border: "none", background: "transparent", fontSize: 12, color: "var(--text-primary)", outline: "none", fontFamily: "Inter, sans-serif" }}
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: "var(--border)", flexShrink: 0 }} />

          {/* Column filters */}
          <MultiSelectDropdown label="PO Number" options={poOptions} selected={filters.poNumbers}
            onChange={v => { onFiltersChange({ ...filters, poNumbers: v }); setPage(1); }} />
          <MultiSelectDropdown label="Design" options={designOptions} selected={filters.designNames}
            onChange={v => { onFiltersChange({ ...filters, designNames: v }); setPage(1); }} />
          <MultiSelectDropdown label="Color" options={colorOptions} selected={filters.yarnColors}
            onChange={v => { onFiltersChange({ ...filters, yarnColors: v }); setPage(1); }} />
          <MultiSelectDropdown label="Karigar" options={karigarOptions} selected={filters.karigarNames}
            onChange={v => { onFiltersChange({ ...filters, karigarNames: v }); setPage(1); }} />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>

          {/* Header */}
          <thead>
            <tr>
              <th style={{ ...thBase, width: 50, paddingLeft: 18, textAlign: "center" }}>#</th>
              <th style={{ ...thSortable, width: 110 }} onClick={() => handleSort("Date")}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  Date <SortIcon dir={sortKey === "Date" ? sortDir : "none"} />
                </div>
              </th>
              <th style={{ ...thSortable, width: "16%" }} onClick={() => handleSort("Buyer PO Number" as SortKey)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  PO Number <SortIcon dir={sortKey === "Buyer PO Number" ? sortDir : "none"} />
                </div>
              </th>
              <th style={{ ...thSortable, width: "auto" }} onClick={() => handleSort("Design Name" as SortKey)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  Design <SortIcon dir={sortKey === "Design Name" ? sortDir : "none"} />
                </div>
              </th>
              <th style={{ ...thBase, width: "12%", textAlign: "center" }}>Color</th>
              <th style={{ ...thBase, width: "12%", textAlign: "center" }}>Size</th>
              <th style={{ ...thSortable, width: "24%" }} onClick={() => handleSort("Name of Karigar 1" as SortKey)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  Karigar <SortIcon dir={sortKey === "Name of Karigar 1" ? sortDir : "none"} />
                </div>
              </th>
              <th style={{ ...thSortRight, width: 160 }} onClick={() => handleSort("dailyPiecesMade")}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <SortIcon dir={sortKey === "dailyPiecesMade" ? sortDir : "none"} />
                  Karigar Acct (Pcs)
                </div>
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} i={i} />)}

            {!isLoading && paginatedRows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "72px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 20,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <PackageOpen size={28} color="var(--text-muted)" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5 }}>
                        No records found
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                        Try adjusting your filters or search query
                      </div>
                    </div>
                    {isFiltered && (
                      <button onClick={clearAll} style={{
                        padding: "7px 16px", borderRadius: 8,
                        background: "rgba(99,102,241,0.10)", color: "#6366f1",
                        border: "1px solid rgba(99,102,241,0.25)", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "Inter, sans-serif",
                      }}>Clear all filters</button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && paginatedRows.map((row, idx) => {
              const globalIdx = (safePage - 1) * pageSize + idx + 1;
              const avColor = getAvatarColor(row.karigarInfo.name);
              const poColor = getPoColor(row["Buyer PO Number"] ?? "");
              const pieces = row.dailyPiecesMade;
              const isHovered = hoveredRow === idx;

              return (
                <tr
                  key={`${row.Date}-${row["Name of Karigar 1"]}-${idx}`}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: "1px solid var(--border-light)",
                    background: isHovered ? "var(--bg-elevated)" : "transparent",
                    transition: "background 0.12s ease",
                    borderLeft: isHovered ? "3px solid #6366f1" : "3px solid transparent",
                  }}
                >
                  {/* # */}
                  <td style={{ ...tdBase, paddingLeft: 14, textAlign: "center", width: 44 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {globalIdx}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ ...tdBase, width: 90 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {formatDate(row.Date)}
                    </div>
                  </td>

                  {/* PO Number */}
                  <td style={{ ...tdBase, width: 130 }}>
                    {row["Buyer PO Number"] ? (
                      <span style={{
                        display: "inline-block",
                        padding: "3px 9px", borderRadius: 7,
                        background: poColor.bg, color: poColor.text,
                        border: `1px solid ${poColor.border}`,
                        fontSize: 11.5, fontWeight: 700, letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                      }}>
                        {row["Buyer PO Number"]}
                      </span>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
                  </td>

                  {/* Design */}
                  <td style={{ ...tdBase, minWidth: 180 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: "var(--text-primary)",
                      maxWidth: 240, margin: "0 auto",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }} title={row["Design Name"] ?? ""}>
                      {row["Design Name"] || "—"}
                    </div>
                  </td>

                  {/* Color */}
                  <td style={{ ...tdBase, width: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {row["Yarn Color"] && row["Yarn Color"] !== "-" && row["Yarn Color"] !== "" ? (
                        <>
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: `hsl(${hashStr(row["Yarn Color"]) % 360},65%,55%)`,
                            border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>
                            {row["Yarn Color"]}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                      )}
                    </div>
                  </td>

                  {/* Size */}
                  <td style={{ ...tdBase, width: 110 }}>
                    {row["Size"] ? (
                      <span style={{
                        fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)",
                        background: "var(--bg-elevated)", border: "1px solid var(--border)",
                        borderRadius: 6, padding: "2px 7px",
                        whiteSpace: "nowrap",
                      }}>
                        {row["Size"]}
                      </span>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
                  </td>

                  {/* Karigar */}
                  <td style={{ ...tdBase, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: avColor.bg, color: avColor.text,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                        letterSpacing: "-0.02em",
                      }}>
                        {initials(row.karigarInfo.name || "?")}
                      </div>
                      <div style={{ minWidth: 0, textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                          {row.karigarInfo.name || "—"}
                        </div>
                        {row.karigarInfo.phone && (
                          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
                            {row.karigarInfo.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Karigar Account Pieces */}
                  <td style={{ ...tdBase, textAlign: "center", paddingRight: 14 }}>
                    {pieces > 0 ? (
                      <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                        padding: "5px 13px", borderRadius: 99,
                        background: "linear-gradient(135deg,rgba(5,150,105,0.12),rgba(5,150,105,0.06))",
                        border: "1px solid rgba(5,150,105,0.22)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}>
                        <ChevronUp size={11} strokeWidth={3} color="#059669" />
                        <span style={{
                          fontSize: 14, fontWeight: 800,
                          color: "#059669",
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "-0.02em",
                        }}>
                          {pieces.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grand Total Footer */}
          {!isLoading && paginatedRows.length > 0 && (
            <tfoot>
              <tr style={{
                background: "linear-gradient(90deg, var(--bg-elevated), var(--bg-card))",
                borderTop: "2px solid var(--border)",
              }}>
                <td colSpan={7} style={{
                  padding: "13px 18px",
                  textAlign: "right",
                  fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}>
                  Grand Total — {sortedRows.length.toLocaleString()} records
                </td>
                <td style={{ padding: "13px 20px 13px 14px", textAlign: "right" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 14px", borderRadius: 99,
                    background: "linear-gradient(135deg,#059669,#065f46)",
                    boxShadow: "0 2px 10px rgba(5,150,105,0.35)",
                  }}>
                    <span style={{
                      fontSize: 16, fontWeight: 900, color: "#fff",
                      fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
                    }}>
                      {grandTotal.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      pcs
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ── */}
      {!isLoading && sortedRows.length > 0 && (
        <div style={{
          padding: "12px 18px",
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-card)",
          gap: 12, flexWrap: "wrap",
        }}>
          {/* Left: Page info */}
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
            Showing{" "}
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {((safePage - 1) * pageSize + 1).toLocaleString()}–{Math.min(safePage * pageSize, sortedRows.length).toLocaleString()}
            </span>
            {" "}of{" "}
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{sortedRows.length.toLocaleString()}</span>
          </div>

          {/* Center: Page numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              id="table-prev"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: safePage === 1 ? "not-allowed" : "pointer",
                opacity: safePage === 1 ? 0.4 : 1,
                color: "var(--text-secondary)", transition: "all 0.12s",
              }}
            >
              <ChevronLeft size={14} />
            </button>

            {pageNums.map((p, i) => (
              p === "..." ? (
                <span key={`dot-${i}`} style={{ padding: "0 4px", fontSize: 13, color: "var(--text-muted)" }}>…</span>
              ) : (
                <button
                  key={p}
                  id={`page-btn-${p}`}
                  onClick={() => setPage(p as number)}
                  style={{
                    minWidth: 32, height: 32, paddingInline: 6, borderRadius: 8,
                    border: safePage === p ? "none" : "1px solid var(--border)",
                    background: safePage === p ? "#6366f1" : "var(--bg-elevated)",
                    color: safePage === p ? "#fff" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: safePage === p ? "0 2px 8px rgba(99,102,241,0.35)" : "none",
                    fontFamily: "Inter, sans-serif",
                    transition: "all 0.12s ease",
                  }}
                >
                  {p}
                </button>
              )
            ))}

            <button
              id="table-next"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: safePage === totalPages ? "not-allowed" : "pointer",
                opacity: safePage === totalPages ? 0.4 : 1,
                color: "var(--text-secondary)", transition: "all 0.12s",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Right: Page size */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Rows per page</span>
            <select
              id="table-page-size"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                padding: "5px 10px", borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "Inter, sans-serif", outline: "none",
              }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
