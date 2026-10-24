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

const MINI_CARDS_CONFIG = [
  {
    id: "mini-stat-grand-total",
    label: "Grand Total",
    unit: "pcs",
    icon: Award,
    valueKey: "grandTotal" as const,
  },
  {
    id: "mini-stat-loop",
    label: "Loop",
    unit: "pcs",
    icon: RefreshCw,
    valueKey: "loop" as const,
  },
  {
    id: "mini-stat-cut",
    label: "Cut",
    unit: "pcs",
    icon: Scissors,
    valueKey: "cut" as const,
  },
  {
    id: "mini-stat-loop-cut",
    label: "Loop + Cut",
    unit: "pcs",
    icon: GitMerge,
    valueKey: "loopCut" as const,
  },
  {
    id: "mini-stat-full-piece",
    label: "Full Piece",
    unit: "pcs",
    icon: Layers,
    valueKey: "fullPiece" as const,
  },
  {
    id: "mini-stat-full-piece-cut",
    label: "Full Piece + Cut",
    unit: "pcs",
    icon: Sparkles,
    valueKey: "fullPieceCut" as const,
  },
  {
    id: "mini-stat-karigars",
    label: "Karigars",
    unit: "active",
    icon: Users,
    valueKey: "karigars" as const,
  },
  {
    id: "mini-stat-records",
    label: "Records",
    unit: "total",
    icon: FileText,
    valueKey: "records" as const,
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
  Icon,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  Icon: React.ElementType;
}) {
  const display = useCountUp(value);

  return (
    <div
      id={id}
      className="pro-stat-card"
      style={{
        flex: "1 1 0",
        minWidth: 125,
        height: 72,
        padding: "9px 12px",
        borderRadius: 12,
        background: "var(--bg-elevated)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "default",
        overflow: "hidden",
      }}
    >
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "rgba(99, 102, 241, 0.10)",
            color: "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={11} />
        </div>
      </div>

      {/* Bottom Value */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {display.toLocaleString()}
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function SkeletonMiniCard() {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 125,
        height: 72,
        padding: "9px 12px",
        borderRadius: 12,
        background: "var(--bg-elevated)",
        border: "1.5px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: 0.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ height: 9, width: "55%", background: "var(--border)", borderRadius: 4 }} />
        <div style={{ width: 20, height: 20, background: "var(--border)", borderRadius: 5 }} />
      </div>
      <div style={{ height: 18, width: "40%", background: "var(--border)", borderRadius: 4 }} />
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

      {/* Center: 8 Professional Mini Scorecards */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          justifyContent: "center",
          overflowX: "auto",
          padding: "2px 0",
        }}
      >
        {MINI_CARDS_CONFIG.map((c) =>
          isLoading ? (
            <SkeletonMiniCard key={c.id} />
          ) : (
            <MiniScorecard
              key={c.id}
              id={c.id}
              label={c.label}
              unit={c.unit}
              value={values[c.valueKey] ?? 0}
              Icon={c.icon}
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
