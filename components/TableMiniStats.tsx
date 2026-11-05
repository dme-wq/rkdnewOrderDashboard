"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Layers,
  Users,
  Filter,
  Scissors,
  RefreshCw,
  Award,
  GitMerge,
  Sparkles,
} from "lucide-react";

interface TableMiniStatsProps {
  grandTotal: number;
  loopPieces: number;
  cutPieces: number;
  loopCutPieces?: number;
  fullPiecePieces: number;
  fullPieceCutPieces?: number;
  karigarCount: number;
  recordCount: number;
  totalPieces?: number;
  isLoading: boolean;
  hasFilter: boolean;
}

interface MiniCardConfig {
  id: string;
  label: string;
  unit: string;
  icon: React.ElementType;
  valueKey: "grandTotal" | "loop" | "cut" | "loopCut" | "fullPiece" | "fullPieceCut" | "karigars" | "records";
  color: string;
}

const MINI_CARDS_CONFIG: MiniCardConfig[] = [
  {
    id: "mini-stat-grand-total",
    label: "Grand Total",
    unit: "pcs",
    icon: Award,
    valueKey: "grandTotal",
    color: "#f59e0b",
  },
  {
    id: "mini-stat-loop",
    label: "Loop",
    unit: "pcs",
    icon: RefreshCw,
    valueKey: "loop",
    color: "#4f46e5",
  },
  {
    id: "mini-stat-cut",
    label: "Cut",
    unit: "pcs",
    icon: Scissors,
    valueKey: "cut",
    color: "#e11d48",
  },
  {
    id: "mini-stat-loop-cut",
    label: "Loop + Cut",
    unit: "pcs",
    icon: GitMerge,
    valueKey: "loopCut",
    color: "#7c3aed",
  },
  {
    id: "mini-stat-full-piece",
    label: "Full Piece",
    unit: "pcs",
    icon: Layers,
    valueKey: "fullPiece",
    color: "#2563eb",
  },
  {
    id: "mini-stat-full-piece-cut",
    label: "Full Piece + Cut",
    unit: "pcs",
    icon: Sparkles,
    valueKey: "fullPieceCut",
    color: "#059669",
  },
  {
    id: "mini-stat-karigars",
    label: "Karigars",
    unit: "active",
    icon: Users,
    valueKey: "karigars",
    color: "#0891b2",
  },
  {
    id: "mini-stat-records",
    label: "Records",
    unit: "total",
    icon: FileText,
    valueKey: "records",
    color: "#c026d3",
  },
];

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === prevRef.current) return;
    const from = prevRef.current;
    prevRef.current = target;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

function MiniScorecard({
  id,
  label,
  unit,
  value,
  config,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  Icon?: React.ElementType;
  config: MiniCardConfig;
}) {
  const display = useCountUp(value);

  return (
    <div
      id={id}
      className="pro-stat-card"
      style={{
        flex: "1 1 0",
        minWidth: 95,
        maxWidth: 125,
        height: 56,
        padding: "6px 10px 6px 10px",
        borderRadius: 9,
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "default",
        position: "relative",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = config.color;
        e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top: Label + Accent Underline Bar */}
      <div>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: "var(--text-secondary)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 20,
            height: 2.5,
            borderRadius: 99,
            background: config.color,
            marginTop: 3,
          }}
        />
      </div>

      {/* Bottom: Tabular Bold Value + Unit */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 2.5 }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {display.toLocaleString()}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function SkeletonMiniCard({ config }: { config: MiniCardConfig }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 95,
        maxWidth: 125,
        height: 56,
        padding: "6px 10px 6px 10px",
        borderRadius: 9,
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: 0.5,
      }}
    >
      <div>
        <div className="skeleton" style={{ height: 9.5, width: "60%", borderRadius: 3 }} />
        <div className="skeleton" style={{ height: 2.5, width: 20, borderRadius: 99, marginTop: 3 }} />
      </div>
      <div className="skeleton" style={{ height: 16, width: "45%", borderRadius: 3 }} />
    </div>
  );
}

export function TableMiniStats({
  grandTotal,
  loopPieces,
  cutPieces,
  loopCutPieces,
  fullPiecePieces,
  fullPieceCutPieces,
  karigarCount,
  recordCount,
  isLoading,
  hasFilter,
}: TableMiniStatsProps) {
  const values: Record<string, number> = {
    grandTotal,
    loop: loopPieces,
    cut: cutPieces,
    loopCut: loopCutPieces !== undefined ? loopCutPieces : loopPieces + cutPieces,
    fullPiece: fullPiecePieces,
    fullPieceCut: fullPieceCutPieces !== undefined ? fullPieceCutPieces : fullPiecePieces + cutPieces,
    karigars: karigarCount,
    records: recordCount,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 18px",
        borderRadius: 18,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      {/* Left: filter badge */}
      <div style={{ display: "flex", alignItems: "center", minWidth: 110 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            background: hasFilter ? "rgba(99,102,241,0.10)" : "var(--bg-elevated)",
            border: `1px solid ${hasFilter ? "rgba(99,102,241,0.25)" : "var(--border)"}`,
          }}
        >
          <Filter size={12} color={hasFilter ? "#6366f1" : "var(--text-muted)"} />
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: hasFilter ? "#6366f1" : "var(--text-secondary)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {hasFilter ? "Filtered" : "All Data"}
          </span>
        </div>
      </div>

      {/* Center: 8 Colorful Compact Mini Scorecards */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          justifyContent: "center",
          overflowX: "auto",
          padding: "2px 0",
        }}
      >
        {MINI_CARDS_CONFIG.map((c) =>
          isLoading ? (
            <SkeletonMiniCard key={c.id} config={c} />
          ) : (
            <MiniScorecard
              key={c.id}
              id={c.id}
              label={c.label}
              unit={c.unit}
              value={values[c.valueKey] ?? 0}
              Icon={c.icon}
              config={c}
            />
          )
        )}
      </div>

      {/* Right: Clean summary label */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          minWidth: 110,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Table Summary
        </span>
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          Responsibility Metrics
        </span>
      </div>
    </div>
  );
}
