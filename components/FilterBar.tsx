"use client";

import { ActiveFilters, DatePreset, ProcessedRow } from "@/lib/types";
import { getDateRangeForPreset } from "@/lib/transform";
import { X, Filter, ChevronDown, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";

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

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all duration-150 whitespace-nowrap
          ${
            selected.length > 0
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[200px] max-h-56 overflow-y-auto
          rounded-xl border border-border bg-card shadow-xl shadow-black/20 py-1">
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No options</div>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                  selected.includes(opt)
                    ? "bg-primary border-primary"
                    : "border-border"
                }`}
              >
                {selected.includes(opt) && <Check size={10} className="text-white" />}
              </div>
              <span className="truncate">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

export function FilterBar({ rows, filters, onFiltersChange }: FilterBarProps) {
  const [activePreset, setActivePreset] = useState<DatePreset | "custom" | "">("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive unique options from rows, cascading based on selected filters
  const uniqueVals = useMemo(() => {
    const poSet = new Set<string>();
    const designSet = new Set<string>();
    const colorSet = new Set<string>();
    const karigarSet = new Set<string>();

    for (const row of rows) {
      poSet.add(row["Buyer PO Number"]?.trim());
      designSet.add(row["Design Name"]?.trim());
      colorSet.add(row["Yarn Color"]?.trim());
      karigarSet.add(row.karigarInfo.name);
    }

    return {
      poNumbers: [...poSet].filter(Boolean).sort(),
      designNames: [...designSet].filter(Boolean).sort(),
      yarnColors: [...colorSet].filter(Boolean).sort(),
      karigarNames: [...karigarSet].filter(Boolean).sort(),
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

  const FilterContent = () => (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Date presets */}
      <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 border border-border">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            id={`preset-${p.value}`}
            onClick={() => applyPreset(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              activePreset === p.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {activePreset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            id="date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-xs border border-border bg-muted/40 text-foreground focus:outline-none focus:border-primary/60"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            id="date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-xs border border-border bg-muted/40 text-foreground focus:outline-none focus:border-primary/60"
          />
        </div>
      )}

      <div className="w-px h-5 bg-border hidden sm:block" />

      {/* Multi-selects */}
      <MultiSelect
        id="filter-po"
        label="PO Number"
        options={uniqueVals.poNumbers}
        selected={filters.poNumbers}
        onChange={(v) => onFiltersChange({ ...filters, poNumbers: v })}
      />
      <MultiSelect
        id="filter-design"
        label="Design"
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

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          id="clear-filters"
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-dashed border-border transition-all"
        >
          <X size={12} />
          Clear all
          <span className="bg-muted text-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {activeCount}
          </span>
        </button>
      )}
    </div>
  );

  return (
    <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 py-3 px-4 sm:px-6 lg:px-8">
      {/* Mobile toggle */}
      <div className="sm:hidden flex items-center justify-between mb-2">
        <button
          id="mobile-filters-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Filter size={16} />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>

      <div className={`sm:block ${mobileOpen ? "block" : "hidden"}`}>
        <FilterContent />
      </div>
    </div>
  );
}
