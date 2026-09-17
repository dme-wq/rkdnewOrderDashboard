"use client";

import { ActiveFilters, DatePreset, ProcessedRow } from "@/lib/types";
import { getDateRangeForPreset } from "@/lib/transform";
import { X, Filter, ChevronDown, Check, Calendar } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface FilterBarProps {
  rows: ProcessedRow[];
  filters: ActiveFilters;
  onFiltersChange: (f: ActiveFilters) => void;
}

const DATE_PRESETS: { label: string; value: DatePreset | "custom" }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Quarter", value: "thisQuarter" },
  { label: "Custom", value: "custom" },
];

// ── Simple multi-select dropdown ─────────────────────────────────────────────

interface MultiSelectProps {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

function MultiSelect({ id, label, options, selected, onChange }: MultiSelectProps) {
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
    <div ref={ref} className="relative">
      <button
        id={id}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium border transition-all duration-200 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          ${
            isActive
              ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
              : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/30"
          }`}
      >
        {label}
        {isActive && (
          <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px]">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : "opacity-60"}`} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 min-w-[220px] max-h-64 overflow-y-auto
          rounded-2xl border border-border bg-card shadow-lg shadow-black/5 py-2 animate-in fade-in slide-in-from-top-2">
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">No options available</div>
          )}
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] text-left hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none"
              >
                <div
                  className={`w-4 h-4 rounded-[4px] flex items-center justify-center border transition-colors flex-shrink-0 ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

export function FilterBar({ rows, filters, onFiltersChange }: FilterBarProps) {
  const [activePreset, setActivePreset] = useState<DatePreset | "custom" | "">("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive unique options
  const uniqueVals = useMemo(() => {
    const poSet = new Set<string>();
    const designSet = new Set<string>();
    const colorSet = new Set<string>();
    const karigarSet = new Set<string>();

    for (const row of rows) {
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
  }, [rows]);

  const activeCount = [
    filters.poNumbers.length,
    filters.designNames.length,
    filters.yarnColors.length,
    filters.karigarNames.length,
    filters.dateFrom ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const applyPreset = (preset: DatePreset | "custom") => {
    setActivePreset(preset);
    if (preset !== "custom") {
      const { from, to } = getDateRangeForPreset(preset);
      onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
    }
  };

  const clearAll = () => {
    setActivePreset("");
    onFiltersChange({
      dateFrom: "",
      dateTo: "",
      poNumbers: [],
      designNames: [],
      yarnColors: [],
      karigarNames: [],
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Row: Date & Global Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left side: Date Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 rounded-full border border-border">
            <Calendar size={14} className="text-muted-foreground ml-1" />
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
                className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  activePreset === p.value
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {activePreset === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="px-3 py-1.5 rounded-full text-[13px] border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="px-3 py-1.5 rounded-full text-[13px] border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
          )}
        </div>

        {/* Right side: Mobile toggle & Clear All */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-[13px] font-medium text-foreground hover:bg-muted/30 transition-colors"
          >
            <Filter size={14} />
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>

          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors group"
            >
              <X size={14} className="group-hover:scale-110 transition-transform" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Multi-select Dropdowns */}
      <div className={`sm:flex flex-wrap items-center gap-2 ${mobileOpen ? "flex" : "hidden"}`}>
        <div className="hidden sm:flex items-center pr-2 text-muted-foreground">
          <Filter size={15} />
        </div>
        <MultiSelect
          id="filter-po"
          label="PO Number"
          options={uniqueVals.poNumbers}
          selected={filters.poNumbers}
          onChange={(v) => onFiltersChange({ ...filters, poNumbers: v })}
        />
        <MultiSelect
          id="filter-design"
          label="Design Name"
          options={uniqueVals.designNames}
          selected={filters.designNames}
          onChange={(v) => onFiltersChange({ ...filters, designNames: v })}
        />
        <MultiSelect
          id="filter-color"
          label="Yarn Color"
          options={uniqueVals.yarnColors}
          selected={filters.yarnColors}
          onChange={(v) => onFiltersChange({ ...filters, yarnColors: v })}
        />
        <MultiSelect
          id="filter-karigar"
          label="Karigar"
          options={uniqueVals.karigarNames}
          selected={filters.karigarNames}
          onChange={(v) => onFiltersChange({ ...filters, karigarNames: v })}
        />
      </div>
    </div>
  );
}
