"use client";

import { FileText, Layers, Users, Filter } from "lucide-react";

interface TableMiniStatsProps {
  totalPieces: number;
  karigarCount: number;
  recordCount: number;
  isLoading: boolean;
  hasFilter: boolean;
}

// Same design as Topbar chips but ~half size (42px)
const MINI_CHIP_CONFIG = [
  {
    id: "mini-stat-records",
    label: "Records",
    icon: FileText,
    gradient: "linear-gradient(140deg,#3730a3,#6366f1)",
    glow: "rgba(99,102,241,0.50)",
    valueKey: "records" as const,
  },
  {
    id: "mini-stat-pieces",
    label: "Pieces",
    icon: Layers,
    gradient: "linear-gradient(140deg,#065f46,#059669)",
    glow: "rgba(5,150,105,0.50)",
    valueKey: "pieces" as const,
  },
  {
    id: "mini-stat-karigars",
    label: "Karigars",
    icon: Users,
    gradient: "linear-gradient(140deg,#92400e,#d97706)",
    glow: "rgba(217,119,6,0.50)",
    valueKey: "karigars" as const,
  },
];

function MiniChip({
  id,
  label,
  value,
  Icon,
  gradient,
  glow,
}: {
  id: string;
  label: string;
  value: number;
  Icon: React.ElementType;
  gradient: string;
  glow: string;
}) {
  return (
    <div
      id={id}
      style={{
        background: gradient,
        boxShadow: `0 2px 12px ${glow}, 0 4px 10px ${glow}`,
        borderRadius: 16,
        width: 62,
        height: 62,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease",
        gap: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "scale(1.10)";
        el.style.boxShadow = `0 4px 20px ${glow}, 0 8px 18px ${glow}`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "scale(1)";
        el.style.boxShadow = `0 2px 12px ${glow}, 0 4px 10px ${glow}`;
      }}
    >
      {/* Inner shine */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%)",
        pointerEvents: "none",
      }} />
      {/* Inner ring for depth */}
      <div style={{
        position: "absolute", inset: 2, borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        pointerEvents: "none",
      }} />

      {/* Icon */}
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        background: "rgba(255,255,255,0.20)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1, flexShrink: 0, marginBottom: 2,
      }}>
        <Icon size={9} />
      </div>

      {/* Number */}
      <div style={{
        fontSize: 15,
        fontWeight: 900,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        zIndex: 1,
      }}>
        {value.toLocaleString()}
      </div>

      {/* Label */}
      <span style={{
        fontSize: 6,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        opacity: 0.85,
        lineHeight: 1,
        zIndex: 1,
        whiteSpace: "nowrap",
        marginTop: 2,
      }}>
        {label}
      </span>
    </div>
  );
}

function SkeletonMiniChip({ gradient, glow }: { gradient: string; glow: string }) {
  return (
    <div style={{
      background: gradient,
      boxShadow: `0 2px 12px ${glow}`,
      borderRadius: 16,
      width: 62, height: 62,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: 0.4, flexShrink: 0,
    }}>
      <div style={{ width: 10, height: 10, background: "rgba(255,255,255,0.25)", borderRadius: "50%" }} />
    </div>
  );
}

export function TableMiniStats({
  totalPieces,
  karigarCount,
  recordCount,
  isLoading,
  hasFilter,
}: TableMiniStatsProps) {
  const values: Record<string, number> = {
    records: recordCount,
    pieces: totalPieces,
    karigars: karigarCount,
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
        boxShadow: "0 2px 14px rgba(0,0,0,0.05)",
      }}
    >
      {/* Left section (Filter indicator) */}
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 8,
            background: hasFilter ? "rgba(99,102,241,0.10)" : "var(--bg-elevated)",
            border: `1px solid ${hasFilter ? "rgba(99,102,241,0.22)" : "var(--border)"}`,
          }}
        >
          <Filter size={12} color={hasFilter ? "#6366f1" : "var(--text-muted)"} />
          <span
            style={{
              fontSize: 11,
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

      {/* Center section (Mini Chips) */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {MINI_CHIP_CONFIG.map((c) =>
          isLoading ? (
            <SkeletonMiniChip key={c.id} gradient={c.gradient} glow={c.glow} />
          ) : (
            <MiniChip
              key={c.id}
              id={c.id}
              label={c.label}
              value={values[c.valueKey]}
              Icon={c.icon}
              gradient={c.gradient}
              glow={c.glow}
            />
          )
        )}
      </div>

      {/* Right section (Label) */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Table Summary
        </span>
      </div>
    </div>
  );
}
