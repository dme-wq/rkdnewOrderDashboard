"use client";

import { ProcessedRow } from "@/lib/types";
import { exportToCSV } from "@/lib/transform";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ArrowLeft,
  ArrowRight,
  PackageOpen,
} from "lucide-react";
import { useMemo, useState } from "react";

interface ProductionTableProps {
  rows: ProcessedRow[];
  isLoading: boolean;
}

type SortKey = keyof ProcessedRow | "poProgress";
type SortDir = "asc" | "desc" | "none";

const PAGE_SIZES = [20, 50, 100];

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp size={12} className="text-primary" />;
  if (dir === "desc") return <ChevronDown size={12} className="text-primary" />;
  return <ChevronsUpDown size={12} className="text-muted-foreground/40" />;
}

interface ColDef {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (row: ProcessedRow) => React.ReactNode;
}

const COLUMNS: ColDef[] = [
  {
    key: "Buyer PO Number",
    label: "PO Number",
    sortable: true,
    className: "w-28",
    render: (row) => (
      <span className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded-md text-foreground">
        {row["Buyer PO Number"]}
      </span>
    ),
  },
  {
    key: "Design Name",
    label: "Design",
    sortable: true,
    className: "max-w-[140px]",
    render: (row) => (
      <span className="text-sm text-foreground truncate block">{row["Design Name"]}</span>
    ),
  },
  {
    key: "Yarn Color",
    label: "Color",
    sortable: true,
    className: "w-24",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <div
          className="w-3 h-3 rounded-full border border-border flex-shrink-0"
          style={{ background: row["Yarn Color"]?.toLowerCase() === "white" ? "#f8fafc" : row["Yarn Color"]?.toLowerCase() }}
        />
        <span className="text-sm">{row["Yarn Color"]}</span>
      </div>
    ),
  },
  {
    key: "Size",
    label: "Size",
    sortable: false,
    className: "w-24",
    render: (row) => (
      <span className="text-xs text-muted-foreground">{row.Size}</span>
    ),
  },
  {
    key: "Name of Karigar 1",
    label: "Karigar",
    sortable: true,
    className: "w-36",
    render: (row) => (
      <div>
        <p className="text-sm font-medium text-foreground">{row.karigarInfo.name}</p>
        <p className="text-[10px] text-muted-foreground">{row.karigarInfo.phone}</p>
      </div>
    ),
  },
  {
    key: "Karigar Account (Pieces)",
    label: "Karigar Acct.",
    sortable: true,
    className: "w-28 text-right",
    render: (row) => (
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {Number(row["Karigar Account (Pieces)"] || 0).toLocaleString()}
      </span>
    ),
  },
  {
    key: "Total Production",
    label: "Cumulative",
    sortable: true,
    className: "w-28 text-right",
    render: (row) => (
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {row.totalProductionNum.toLocaleString()}
      </span>
    ),
  },
  {
    key: "dailyPiecesMade",
    label: "Daily Δ",
    sortable: true,
    className: "w-20 text-right",
    render: (row) => (
      <span className={`text-sm font-semibold tabular-nums ${row.dailyPiecesMade > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
        +{row.dailyPiecesMade}
      </span>
    ),
  },
  {
    key: "poProgress",
    label: "% PO Target",
    sortable: true,
    className: "w-36",
    render: (row) => (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground tabular-nums">{row.poProgress}%</span>
          <span className="text-[10px] text-muted-foreground">{row.poTarget.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              row.poProgress >= 100
                ? "bg-emerald-400"
                : row.poProgress >= 75
                ? "bg-amber-400"
                : "bg-violet-500"
            }`}
            style={{ width: `${Math.min(row.poProgress, 100)}%` }}
          />
        </div>
      </div>
    ),
  },
];

export function ProductionTable({ rows, isLoading }: ProductionTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("none");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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
  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const paginatedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

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

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Table toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="table-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search PO, product, karigar..."
              className="pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-muted/40 text-foreground
                placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 w-60"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {sortedRows.length.toLocaleString()} rows
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="text-xs border border-border bg-muted/40 text-foreground rounded-lg px-2 py-1.5 focus:outline-none"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>

          <button
            id="export-csv"
            onClick={() => exportToCSV(sortedRows)}
            disabled={sortedRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border
              bg-muted/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-50"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto relative w-full">
        <table className="w-full text-sm border-collapse min-w-[800px]">
          <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 w-12">
                #
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 ${col.className ?? ""} ${
                    col.sortable ? "cursor-pointer hover:text-foreground select-none group" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <SortIcon dir={sortKey === col.key ? sortDir : "none"} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-5 py-3.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/60 w-24">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border/40">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && paginatedRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <PackageOpen size={40} className="opacity-30 mb-2" />
                    <p className="text-sm font-medium text-foreground">No records found</p>
                    <p className="text-[13px] opacity-70">Try adjusting your filters or search query</p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedRows.map((row, idx) => (
                <tr
                  key={`${row["Buyer PO Number"]}-${row.karigarInfo.fullRaw}-${row.Date}-${idx}`}
                  className="group transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4 text-[13px] text-muted-foreground tabular-nums">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={`px-5 py-4 align-middle ${col.className ?? ""}`}>
                      {col.render ? col.render(row) : <span className="text-[13.5px]">{String(row[col.key as keyof ProcessedRow] ?? "")}</span>}
                    </td>
                  ))}
                  <td className="px-5 py-4 text-[13px] text-muted-foreground whitespace-nowrap">
                    {row.Date}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {sortedRows.length.toLocaleString()} total rows
          </p>
          <div className="flex items-center gap-1">
            <button
              id="pagination-prev"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 transition-all"
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
                  id={`pagination-${p}`}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                    p === page
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              id="pagination-next"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 transition-all"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
