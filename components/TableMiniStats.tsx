"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Layers, Users, Filter, Scissors, RefreshCw, Award, GitMerge } from "lucide-react";

interface TableMiniStatsProps {
  grandTotal: number;
  loopPieces: number;
  cutPieces: number;
  loopCutPieces?: number;
  fullPiecePieces: number;
  karigarCount: number;
  recordCount: number;
  totalPieces?: number;
  isLoading: boolean;
  hasFilter: boolean;
}

const MINI_CHIP_CONFIG = [
  {
    id: "mini-stat-grand-total",
    label: "Grand Total",
    sublabel: "Store Recv",
    icon: Award,
    gradient: "linear-gradient(145deg,#064e3b,#059669,#10b981)",
    glow: "rgba(16,185,129,0.55)",
    valueKey: "grandTotal" as const,
  },
  {
    id: "mini-stat-loop",
    label: "Loop",
    sublabel: "Store Recv",
    icon: RefreshCw,
    gradient: "linear-gradient(145deg,#1e3a8a,#2563eb,#60a5fa)",
    glow: "rgba(59,130,246,0.55)",
    valueKey: "loop" as const,
  },
  {
    id: "mini-stat-cut",
    label: "Cut",
    sublabel: "Store Recv",
    icon: Scissors,
    gradient: "linear-gradient(145deg,#581c87,#7c3aed,#c084fc)",
    glow: "rgba(147,51,234,0.55)",
    valueKey: "cut" as const,
  },
  {
    id: "mini-stat-loop-cut",
    label: "Loop + Cut",
    sublabel: "Combined",
    icon: GitMerge,
    gradient: "linear-gradient(145deg,#0284c7,#4f46e5,#7c3aed)",
    glow: "rgba(99,102,241,0.55)",
    valueKey: "loopCut" as const,
  },
  {
    id: "mini-stat-full-piece",
    label: "Full Piece",
    sublabel: "Store Recv",
    icon: Layers,
    gradient: "linear-gradient(145deg,#881337,#e11d48,#fb7185)",
    glow: "rgba(225,29,72,0.55)",
    valueKey: "fullPiece" as const,
  },
  {
    id: "mini-stat-karigars",
    label: "Karigars",
    sublabel: "Active",
    icon: Users,
    gradient: "linear-gradient(145deg,#78350f,#d97706,#fbbf24)",
    glow: "rgba(217,119,6,0.55)",
    valueKey: "karigars" as const,
  },
  {
    id: "mini-stat-records",
    label: "Records",
    sublabel: "Filtered",
    icon: FileText,
    gradient: "linear-gradient(145deg,#312e81,#4f46e5,#818cf8)",
    glow: "rgba(99,102,241,0.55)",
    valueKey: "records" as const,
  },
];

// Inline keyframe style injected once
const RAINBOW_STYLE = `
@keyframes rainbowCard {
  0%   { border-color: #ff0080; box-shadow: 0 0 0 3px rgba(255,0,128,0.35), 0 8px 32px rgba(255,0,128,0.25); }
  14%  { border-color: #ff6000; box-shadow: 0 0 0 3px rgba(255,96,0,0.35),  0 8px 32px rgba(255,96,0,0.25); }
  28%  { border-color: #ffe000; box-shadow: 0 0 0 3px rgba(255,224,0,0.35), 0 8px 32px rgba(255,224,0,0.25); }
  42%  { border-color: #00e676; box-shadow: 0 0 0 3px rgba(0,230,118,0.35), 0 8px 32px rgba(0,230,118,0.25); }
  57%  { border-color: #00b0ff; box-shadow: 0 0 0 3px rgba(0,176,255,0.35), 0 8px 32px rgba(0,176,255,0.25); }
  71%  { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.35),0 8px 32px rgba(124,58,237,0.25); }
  85%  { border-color: #e040fb; box-shadow: 0 0 0 3px rgba(224,64,251,0.35),0 8px 32px rgba(224,64,251,0.25); }
  100% { border-color: #ff0080; box-shadow: 0 0 0 3px rgba(255,0,128,0.35), 0 8px 32px rgba(255,0,128,0.25); }
}
.mini-card-rainbow {
  border: 2.5px solid #ff0080;
  animation: rainbowCard 2.4s linear infinite;
}
.mini-card-rainbow:hover {
  transform: translateY(-5px) scale(1.05) !important;
}
`;

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

function MiniChip({
  id,
  label,
  sublabel,
  value,
  Icon,
  gradient,
}: {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  Icon: React.ElementType;
  gradient: string;
}) {
  const display = useCountUp(value);

  return (
    <div
      id={id}
      className="mini-card-rainbow"
      style={{
        background: gradient,
        borderRadius: 20,
        width: 96,
        height: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        gap: 2,
      }}
    >
      {/* Top-left shine orb */}
      <div
        style={{
          position: "absolute",
          top: -16,
          left: -16,
          width: 54,
          height: 54,
          background: "rgba(255,255,255,0.20)",
          borderRadius: "50%",
          pointerEvents: "none",
          filter: "blur(5px)",
        }}
      />

      {/* Glass inner shine */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 52%)",
          pointerEvents: "none",
        }}
      />

      {/* Inner white border for depth */}
      <div
        style={{
          position: "absolute",
          inset: 3.5,
          borderRadius: 16,
          border: "1.5px solid rgba(255,255,255,0.24)",
          pointerEvents: "none",
        }}
      />

      {/* Icon bubble */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          background: "rgba(255,255,255,0.24)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          flexShrink: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        <Icon size={13} />
      </div>

      {/* Number */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          zIndex: 1,
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {display.toLocaleString()}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 8,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          opacity: 0.92,
          lineHeight: 1,
          zIndex: 1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Sublabel */}
      {sublabel && (
        <span
          style={{
            fontSize: 6,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            opacity: 0.75,
            lineHeight: 1,
            zIndex: 1,
            whiteSpace: "nowrap",
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

function SkeletonMiniChip({ gradient }: { gradient: string }) {
  return (
    <div
      style={{
        background: gradient,
        borderRadius: 20,
        width: 96,
        height: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.38,
        flexShrink: 0,
        gap: 4,
      }}
    >
      <div
        style={{ width: 24, height: 24, background: "rgba(255,255,255,0.25)", borderRadius: 8 }}
      />
      <div
        style={{ height: 7, width: "50%", background: "rgba(255,255,255,0.30)", borderRadius: 4 }}
      />
      <div
        style={{ height: 5, width: "60%", background: "rgba(255,255,255,0.20)", borderRadius: 4 }}
      />
    </div>
  );
}

export function TableMiniStats({
  grandTotal,
  loopPieces,
  cutPieces,
  loopCutPieces,
  fullPiecePieces,
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
    karigars: karigarCount,
    records: recordCount,
  };

  return (
    <>
      {/* Inject rainbow animation */}
      <style>{RAINBOW_STYLE}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 20px",
          borderRadius: 22,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left: filter badge */}
        <div style={{ display: "flex", alignItems: "center", minWidth: 120 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 13px",
              borderRadius: 10,
              background: hasFilter ? "rgba(99,102,241,0.10)" : "var(--bg-elevated)",
              border: `1px solid ${hasFilter ? "rgba(99,102,241,0.22)" : "var(--border)"}`,
            }}
          >
            <Filter size={13} color={hasFilter ? "#6366f1" : "var(--text-muted)"} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: hasFilter ? "#6366f1" : "var(--text-muted)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              {hasFilter ? "Filtered" : "All Data"}
            </span>
          </div>
        </div>

        {/* Center: Responsibility & Summary Cards */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: 1,
            justifyContent: "center",
            overflowX: "auto",
            padding: "4px 0",
          }}
        >
          {MINI_CHIP_CONFIG.map((c) =>
            isLoading ? (
              <SkeletonMiniChip key={c.id} gradient={c.gradient} />
            ) : (
              <MiniChip
                key={c.id}
                id={c.id}
                label={c.label}
                sublabel={c.sublabel}
                value={values[c.valueKey] ?? 0}
                Icon={c.icon}
                gradient={c.gradient}
              />
            )
          )}
        </div>

        {/* Right: label */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            minWidth: 120,
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
            Store Receiving by Responsibility
          </span>
        </div>
      </div>
    </>
  );
}
