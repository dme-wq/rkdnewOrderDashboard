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
  gradient: string;
  iconBg: string;
  border: string;
}

const MINI_CARDS_CONFIG: MiniCardConfig[] = [
  {
    id: "mini-stat-grand-total",
    label: "Grand Total",
    unit: "pcs",
    icon: Award,
    valueKey: "grandTotal",
    color: "#059669",
    gradient: "linear-gradient(135deg, #059669, #10b981)",
    iconBg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.30)",
  },
  {
    id: "mini-stat-loop",
    label: "Loop",
    unit: "pcs",
    icon: RefreshCw,
    valueKey: "loop",
    color: "#4f46e5",
    gradient: "linear-gradient(135deg, #4338ca, #6366f1)",
    iconBg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.30)",
  },
  {
    id: "mini-stat-cut",
    label: "Cut",
    unit: "pcs",
    icon: Scissors,
    valueKey: "cut",
    color: "#e11d48",
    gradient: "linear-gradient(135deg, #be123c, #f43f5e)",
    iconBg: "rgba(225, 29, 72, 0.15)",
    border: "rgba(225, 29, 72, 0.30)",
  },
  {
    id: "mini-stat-loop-cut",
    label: "Loop + Cut",
    unit: "pcs",
    icon: GitMerge,
    valueKey: "loopCut",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
    iconBg: "rgba(124, 58, 237, 0.15)",
    border: "rgba(124, 58, 237, 0.30)",
  },
  {
    id: "mini-stat-full-piece",
    label: "Full Piece",
    unit: "pcs",
    icon: Layers,
    valueKey: "fullPiece",
    color: "#2563eb",
    gradient: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
    iconBg: "rgba(37, 99, 235, 0.15)",
    border: "rgba(37, 99, 235, 0.30)",
  },
  {
    id: "mini-stat-full-piece-cut",
    label: "Full Piece + Cut",
    unit: "pcs",
    icon: Sparkles,
    valueKey: "fullPieceCut",
    color: "#d97706",
    gradient: "linear-gradient(135deg, #b45309, #f59e0b)",
    iconBg: "rgba(217, 119, 6, 0.15)",
    border: "rgba(217, 119, 6, 0.30)",
  },
  {
    id: "mini-stat-karigars",
    label: "Karigars",
    unit: "active",
    icon: Users,
    valueKey: "karigars",
    color: "#0891b2",
    gradient: "linear-gradient(135deg, #0e7490, #06b6d4)",
    iconBg: "rgba(8, 145, 178, 0.15)",
    border: "rgba(8, 145, 178, 0.30)",
  },
  {
    id: "mini-stat-records",
    label: "Records",
    unit: "total",
    icon: FileText,
    valueKey: "records",
    color: "#c026d3",
    gradient: "linear-gradient(135deg, #a21caf, #e879f9)",
    iconBg: "rgba(192, 38, 211, 0.15)",
    border: "rgba(192, 38, 211, 0.30)",
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
  config,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  Icon: React.ElementType;
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
        maxWidth: 130,
        height: 58,
        padding: "0",
        borderRadius: 10,
        background: "var(--bg-card)",
        border: `1.5px solid ${config.border}`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top colorful accent strip */}
      <div
        style={{
          height: 2.5,
          background: config.gradient,
          width: "100%",
          flexShrink: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 6px 5px",
          textAlign: "center",
        }}
      >
        {/* Top Header: Centered Icon + Label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%" }}>
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: 4,
              background: config.iconBg,
              color: config.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={9} />
          </div>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
            }}
          >
            {label}
          </span>
        </div>

        {/* Bottom Value: Centered Number with bold tabular typography */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2.5, width: "100%" }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1,
              letterSpacing: "-0.035em",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "'Inter', system-ui, sans-serif",
              textAlign: "center",
            }}
          >
            {display.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: config.color,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {unit}
          </span>
        </div>
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
        maxWidth: 130,
        height: 58,
        borderRadius: 10,
        background: "var(--bg-card)",
        border: `1.5px solid var(--border)`,
        overflow: "hidden",
        opacity: 0.5,
      }}
    >
      <div style={{ height: 2.5, background: config.gradient, width: "100%" }} />
      <div style={{ padding: "4px 6px 5px", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", height: "calc(100% - 2.5px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%" }}>
          <div style={{ width: 15, height: 15, borderRadius: 4, background: config.iconBg }} />
          <div className="skeleton" style={{ height: 7, width: "50%", borderRadius: 3 }} />
        </div>
        <div className="skeleton" style={{ height: 13, width: "45%", borderRadius: 3 }} />
      </div>
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
