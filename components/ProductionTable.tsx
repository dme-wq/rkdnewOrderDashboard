"use client";

import { ProcessedRow, ActiveFilters, DatePreset } from "@/lib/types";
import { exportToCSV, getDateRangeForPreset } from "@/lib/transform";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  SlidersHorizontal,
  Check,
  CalendarRange,
  X,
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

// Karigar avatar color palette
const AVATAR_COLORS = [
  { bg: "rgba(99,102,241,0.15)", text: "#6366f1" },
  { bg: "rgba(139,92,246,0.15)", text: "#8b5cf6" },
  { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
  { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  { bg: "rgba(236,72,153,0.15)", text: "#ec4899" },
  { bg: "rgba(6,182,212,0.15)", text: "#06b6d4" },
  { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div
            className="skeleton"
            style={{ height: i === 6 ? 32 : 14, borderRadius: i === 6 ? 99 : 6, width: `${55 + (i % 4) * 12}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp size={12} color="#6366f1" />;
  if (dir === "desc") return <ChevronDown size={12} color="#6366f1" />;
  return <ChevronsUpDown size={12} style={{ opacity: 0.35 }} />;
}

function formatDate(dateStr: string) {
  return dateStr;
}

// ── Smart Column Filter Dropdown ─────────────────────────────────────────────

interface SmartFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

function SmartFilter({ label, options, selected, onChange }: SmartFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((s) => s !== val));
    else onChange([...selected, val]);
  };

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const isActive = selected.length > 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`filter-chip ${isActive || open ? "filter-chip-active" : ""}`}
      >
        {label}
        {isActive && (
          <span className="filter-count">{selected.length}</span>
        )}
        <ChevronDown
          size={12}
          style={{
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="dropdown-anim"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 200,
            minWidth: 220,
            maxHeight: 280,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search inside filter */}
          {options.length > 6 && (
            <div style={{ padding: "10px 12px 6px", borderBottom: "1px solid var(--border-light)" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label}...`}
                autoFocus
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  fontSize: 12,
                  fontFamily: "Inter, sans-serif",
                  border: "1.5px solid var(--border)",
                  borderRadius: 8,
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Options list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "16px 14px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                No options
              </div>
            )}
            {filtered.map((opt) => {
              const isSel = selected.includes(opt);
              return (
                <label
                  key={opt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 14px",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    transition: "background 0.12s",
                    background: isSel ? "var(--indigo-dim)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isSel ? "var(--indigo-dim)" : "transparent"; }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 5,
                      border: `2px solid ${isSel ? "var(--indigo)" : "var(--border)"}`,
                      background: isSel ? "var(--indigo)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {isSel && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt}</span>
                </label>
              );
            })}
          </div>

          {/* Footer */}
          {options.length > 0 && (
            <div
              style={{
                padding: "8px 12px",
                borderTop: "1px solid var(--border-light)",
                background: "var(--bg-elevated)",
              }}
            >
              <button
                onClick={() => { onChange([]); setQuery(""); }}
                disabled={!isActive}
                style={{
                  width: "100%",
                  padding: "6px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  color: isActive ? "var(--indigo-light)" : "var(--text-muted)",
                  background: "transparent",
                  border: "none",
                  cursor: isActive ? "pointer" : "not-allowed",
                  borderRadius: 6,
                  transition: "background 0.12s",
                }}
              >
                {isActive ? `Clear ${selected.length} selected` : "No selection"}
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

  // Extract unique values for filters from ALL rows
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
    search.trim() ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const grandTotal = useMemo(
    () => searchedRows.reduce((sum, row) => sum + row.dailyPiecesMade, 0),
    [searchedRows]
  );

  // Pagination page numbers
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const pages: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "…") {
        pages.push("…");
      }
    }
    return pages;
  }, [page, totalPages]);

  const thStyle: React.CSSProperties = {
    padding: "13px 16px",
    textAlign: "left",
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  const thRight: React.CSSProperties = { ...thStyle, textAlign: "right" };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Row 1: Search + Export ── */}
      <div
        style={{
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search PO, Design, Karigar..."
            className="table-search-input"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Result count badge */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
            padding: "5px 12px",
            background: "var(--bg-elevated)",
            borderRadius: 99,
            border: "1px solid var(--border)",
          }}
        >
          {sortedRows.length.toLocaleString()} records
        </div>

        <div style={{ flex: 1 }} />

        {/* Clear all */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              color: "var(--text-secondary)",
              background: "transparent",
              border: "1.5px solid var(--border)",
              borderRadius: 99,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#e11d48";
              (e.currentTarget as HTMLElement).style.color = "#e11d48";
              (e.currentTarget as HTMLElement).style.background = "rgba(225,29,72,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <X size={12} />
            Clear {activeFiltersCount}
          </button>
        )}

        {/* Export */}
        <button
          onClick={() => exportToCSV(sortedRows)}
          disabled={sortedRows.length === 0}
          className="export-btn"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* ── Row 2: Date Presets + Column Filters ── */}
      <div
        style={{
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border-light)",
          background: "var(--bg-elevated)",
        }}
      >
        {/* Date preset pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <CalendarRange size={14} style={{ color: "var(--text-muted)", marginRight: 4, flexShrink: 0 }} />
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => applyPreset(p.value)}
              className={`date-pill ${activePreset === p.value ? "date-pill-active" : "date-pill-inactive"}`}
            >
              {p.label}
            </button>
          ))}
          {activePreset && (
            <button
              onClick={() => { setActivePreset(""); onFiltersChange({ ...filters, dateFrom: "", dateTo: "" }); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 99,
                border: "none",
                background: "var(--border)",
                color: "var(--text-muted)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, height: 22, background: "var(--border)", flexShrink: 0 }} />

        {/* Column filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <SlidersHorizontal size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
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
      </div>

      {/* ── Custom Date Range Picker ── */}
      {activePreset === "custom" && (
        <div
          className="dropdown-anim"
          style={{
            padding: "10px 18px",
            borderBottom: "1px solid var(--border-light)",
            background: "var(--bg-elevated)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CalendarRange size={14} style={{ color: "var(--indigo-light)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Custom Range:</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              outline: "none",
              cursor: "pointer",
            }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>→</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontFamily: "Inter, sans-serif",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              outline: "none",
              cursor: "pointer",
            }}
          />
        </div>
      )}

      {/* ── Data Table ── */}
      <div style={{ overflowX: "auto", flex: 1, maxHeight: 540 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ ...thStyle, width: 52, paddingLeft: 18 }}>#</th>

              <th style={{ ...thStyle, width: 120 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                  onClick={() => handleSort("Date")}
                >
                  Date <SortIcon dir={sortKey === "Date" ? sortDir : "none"} />
                </div>
              </th>

              <th style={{ ...thStyle, width: 110 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                  onClick={() => handleSort("Buyer PO Number")}
                >
                  PO # <SortIcon dir={sortKey === "Buyer PO Number" ? sortDir : "none"} />
                </div>
              </th>

              <th style={{ ...thStyle, minWidth: 200 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                  onClick={() => handleSort("Design Name")}
                >
                  Design <SortIcon dir={sortKey === "Design Name" ? sortDir : "none"} />
                </div>
              </th>

              <th style={{ ...thStyle, width: 120 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                  onClick={() => handleSort("Yarn Color")}
                >
                  Color <SortIcon dir={sortKey === "Yarn Color" ? sortDir : "none"} />
                </div>
              </th>

              <th style={{ ...thStyle, width: 100 }}>Size</th>

              <th style={{ ...thStyle, minWidth: 180 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                  onClick={() => handleSort("Name of Karigar 1")}
                >
                  Karigar <SortIcon dir={sortKey === "Name of Karigar 1" ? sortDir : "none"} />
                </div>
              </th>

              <th
                style={{ ...thRight, width: 120, paddingRight: 20, cursor: "pointer" }}
                onClick={() => handleSort("dailyPiecesMade")}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                  <SortIcon dir={sortKey === "dailyPiecesMade" ? sortDir : "none"} />
                  Daily Δ
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && paginatedRows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "64px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PackageOpen size={28} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                        No records found
                      </p>
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        Try adjusting your filters or search query
                      </p>
                    </div>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        style={{
                          marginTop: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: "Inter, sans-serif",
                          color: "var(--indigo-light)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedRows.map((row, idx) => {
                const avatarColor = getAvatarColor(row.karigarInfo.name);
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={`${row["Buyer PO Number"]}-${row.karigarInfo.fullRaw}-${row.Date}-${idx}`}
                    style={{
                      borderBottom: "1px solid var(--border-light)",
                      background: isEven ? "var(--bg-card)" : "var(--bg-elevated)",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = isEven ? "var(--bg-card)" : "var(--bg-elevated)";
                    }}
                  >
                    {/* Row number */}
                    <td style={{ padding: "12px 16px 12px 18px" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                        {(page - 1) * pageSize + idx + 1}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(row.Date)}
                      </span>
                    </td>

                    {/* PO Number */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--indigo-light)",
                          background: "var(--indigo-dim)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row["Buyer PO Number"]}
                      </span>
                    </td>

                    {/* Design */}
                    <td style={{ padding: "12px 16px", maxWidth: 200 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row["Design Name"]}
                      </span>
                    </td>

                    {/* Color */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: "2px solid var(--border)",
                            flexShrink: 0,
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                            background:
                              row["Yarn Color"]?.toLowerCase() === "white"
                                ? "#f8fafc"
                                : row["Yarn Color"]?.toLowerCase(),
                          }}
                        />
                        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{row["Yarn Color"]}</span>
                      </div>
                    </td>

                    {/* Size */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.Size}
                      </span>
                    </td>

                    {/* Karigar */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: avatarColor.bg,
                            color: avatarColor.text,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {row.karigarInfo.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              lineHeight: 1.3,
                            }}
                          >
                            {row.karigarInfo.name}
                          </p>
                          {row.karigarInfo.phone && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                              {row.karigarInfo.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Daily Delta */}
                    <td style={{ padding: "12px 20px 12px 16px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          ...(row.dailyPiecesMade > 0
                            ? {
                                background: "rgba(5,150,105,0.10)",
                                color: "#059669",
                                border: "1px solid rgba(5,150,105,0.20)",
                              }
                            : {
                                background: "var(--bg-elevated)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--border)",
                              }),
                        }}
                      >
                        {row.dailyPiecesMade > 0 && <ChevronUp size={11} strokeWidth={3} />}
                        {row.dailyPiecesMade > 0 ? row.dailyPiecesMade : "—"}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>

          {/* Grand Total Footer */}
          {!isLoading && paginatedRows.length > 0 && (
            <tfoot>
              <tr
                style={{
                  background: "var(--bg-elevated)",
                  borderTop: "2px solid var(--border)",
                  position: "sticky",
                  bottom: 0,
                }}
              >
                <td
                  colSpan={7}
                  style={{
                    padding: "11px 16px",
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                  }}
                >
                  Grand Total
                </td>
                <td style={{ padding: "11px 20px 11px 16px", textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--indigo-light)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {grandTotal.toLocaleString()}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-card)",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Left: count + page size */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{(page - 1) * pageSize + 1}</span>
            {" – "}
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{Math.min(page * pageSize, sortedRows.length)}</span>
            {" of "}
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{sortedRows.length}</span>
          </span>

          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              border: "1.5px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              borderRadius: 8,
              padding: "4px 8px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        </div>

        {/* Right: page buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--bg-card)",
              color: page === 1 ? "var(--text-muted)" : "var(--text-primary)",
              cursor: page === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: page === 1 ? 0.4 : 1,
              transition: "all 0.12s",
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {pageNumbers.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "var(--text-muted)", fontSize: 13 }}>
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: `1.5px solid ${p === page ? "var(--indigo)" : "var(--border)"}`,
                  background: p === page ? "var(--indigo)" : "var(--bg-card)",
                  color: p === page ? "#fff" : "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: p === page ? "0 2px 8px rgba(79,70,229,0.35)" : "none",
                }}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--bg-card)",
              color: page === totalPages ? "var(--text-muted)" : "var(--text-primary)",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: page === totalPages ? 0.4 : 1,
              transition: "all 0.12s",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
