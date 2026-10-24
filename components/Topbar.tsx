"use client";

import { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  Sun,
  Moon,
  Calendar,
  CalendarDays,
  BarChart3,
  Layers,
  Scissors,
  Award,
  Package,
  Sparkles,
  GitMerge,
} from "lucide-react";
import { useTheme } from "next-themes";
import { AggregatedStats } from "@/lib/types";

interface TopbarProps {
  lastUpdated: string | null;
  isLoading: boolean; // true ONLY on first load (no data yet)
  isFetching: boolean; // true on every background refetch too
  isError: boolean;
  onRefresh: () => void;
  stats: AggregatedStats | null;
}

// ── Animated count-up / count-down hook ─────────────────────────────────────
function useCountUp(target: number, duration = 700) {
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
      const eased = 1 - Math.pow(1 - p, 4); // ease-out-quart
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

// ── Single glowing circle chip ───────────────────────────────────────────────
interface ChipDef {
  label: string;
  sublabel?: string;
  value: number;
  Icon: React.ComponentType<{ size?: number }>;
  gradient: string;
  glow: string;
  size?: number;
}

function StatChip({ label, sublabel, value, Icon, gradient, glow, size = 92 }: ChipDef) {
  const display = useCountUp(value);
  const isCompact = size < 85;

  return (
    <div
      className="stat-chip-rainbow"
      style={{
        background: gradient,
        borderRadius: "50%",
        width: size,
        height: size,
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
        gap: isCompact ? 1 : 2,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.11)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
    >
      {/* Inner shine */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* Inner white ring for depth */}
      <div
        style={{
          position: "absolute",
          inset: 3.5,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.24)",
          pointerEvents: "none",
        }}
      />

      {/* Icon bubble */}
      <div
        style={{
          width: isCompact ? 20 : 22,
          height: isCompact ? 20 : 22,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <Icon size={isCompact ? 11 : 12} />
      </div>

      {/* Number — animated */}
      <div
        style={{
          fontSize: isCompact ? 16 : 20,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          zIndex: 1,
        }}
      >
        {display.toLocaleString()}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: isCompact ? 7 : 8,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          opacity: 0.9,
          lineHeight: 1,
          zIndex: 1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Sublabel if present */}
      {sublabel && (
        <span
          style={{
            fontSize: isCompact ? 5.5 : 6.5,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            opacity: 0.72,
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

function SkeletonChip({
  gradient,
  glow,
  size = 92,
}: {
  gradient: string;
  glow: string;
  size?: number;
}) {
  return (
    <div
      style={{
        background: gradient,
        boxShadow: `0 0 10px ${glow}`,
        borderRadius: "50%",
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        opacity: 0.4,
        flexShrink: 0,
      }}
    >
      <div
        style={{ width: 20, height: 20, background: "rgba(255,255,255,0.25)", borderRadius: "50%" }}
      />
      <div
        style={{ height: 6, width: "50%", background: "rgba(255,255,255,0.22)", borderRadius: 3 }}
      />
      <div
        style={{ height: 14, width: "40%", background: "rgba(255,255,255,0.30)", borderRadius: 3 }}
      />
    </div>
  );
}

// ── Chip Configurations ───────────────────────────────────────────────────────

// Store Receiving chips (Column K: Loop, Cut, Full Piece, Loop + Cut & Grand Total from Column Y)
const RESPONSIBILITY_CHIPS = [
  {
    label: "Grand Total",
    sublabel: "All Resp.",
    key: "grandTotalStoreReceiving" as const,
    Icon: Award,
    gradient: "linear-gradient(140deg,#064e3b,#059669,#10b981)",
    glow: "rgba(16,185,129,0.55)",
  },
  {
    label: "Loop",
    sublabel: "Store Recv",
    key: "loopPieces" as const,
    Icon: RefreshCw,
    gradient: "linear-gradient(140deg,#1e3a8a,#2563eb,#3b82f6)",
    glow: "rgba(59,130,246,0.55)",
  },
  {
    label: "Cut",
    sublabel: "Store Recv",
    key: "cutPieces" as const,
    Icon: Scissors,
    gradient: "linear-gradient(140deg,#581c87,#7c3aed,#9333ea)",
    glow: "rgba(147,51,234,0.55)",
  },
  {
    label: "Loop + Cut",
    sublabel: "Combined",
    key: "loopCutPieces" as const,
    Icon: GitMerge,
    gradient: "linear-gradient(140deg,#0284c7,#4f46e5,#7c3aed)",
    glow: "rgba(99,102,241,0.55)",
  },
  {
    label: "Full Piece",
    sublabel: "Store Recv",
    key: "fullPiecePieces" as const,
    Icon: Layers,
    gradient: "linear-gradient(140deg,#881337,#e11d48,#f43f5e)",
    glow: "rgba(244,63,94,0.55)",
  },
];

// Production Trend chips
const PERIOD_CHIPS = [
  {
    label: "Today",
    sublabel: "Production",
    key: "todayPieces" as const,
    Icon: Calendar,
    gradient: "linear-gradient(140deg,#312e81,#4f46e5,#6366f1)",
    glow: "rgba(99,102,241,0.50)",
  },
  {
    label: "This Week",
    sublabel: "Production",
    key: "thisWeekPieces" as const,
    Icon: CalendarDays,
    gradient: "linear-gradient(140deg,#4c1d95,#6d28d9,#8b5cf6)",
    glow: "rgba(139,92,246,0.50)",
  },
  {
    label: "Month",
    sublabel: "Production",
    key: "thisMonthPieces" as const,
    Icon: Layers,
    gradient: "linear-gradient(140deg,#9f1239,#be123c,#e11d48)",
    glow: "rgba(225,29,72,0.50)",
  },
];

type TopbarViewMode = "receiving" | "production" | "all";

export function Topbar({
  lastUpdated,
  isLoading,
  isFetching,
  isError,
  onRefresh,
  stats,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<TopbarViewMode>("receiving");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
      setSecondsAgo(diff);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const syncLabel = isError
    ? "Sync failed"
    : isLoading
      ? "Syncing..."
      : secondsAgo !== null
        ? secondsAgo < 60
          ? `${secondsAgo}s ago`
          : `${Math.floor(secondsAgo / 60)}m ago`
        : "";

  const isBackgroundFetching = isFetching && !isLoading;

  const currentChips =
    viewMode === "receiving"
      ? RESPONSIBILITY_CHIPS
      : viewMode === "production"
        ? PERIOD_CHIPS
        : [...RESPONSIBILITY_CHIPS, ...PERIOD_CHIPS];

  const chipSize = viewMode === "all" ? 72 : 86;

  return (
    <div
      className="topbar"
      style={{
        minHeight: 104,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 8,
        paddingBottom: 8,
        alignItems: "center",
      }}
    >
      {/* LEFT: Logo */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#fff",
            padding: 2,
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src="https://static.wixstatic.com/media/68b92a_d71e34133826499983234774dea1945b~mv2.png/v1/fill/w_186,h_156,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/RKD-Logo.png"
            alt="RKD Logo"
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </div>
      </div>

      {/* CENTER: View selector & Stat chips */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flex: 1,
          padding: "0 10px",
        }}
      >
        {/* Sleek Segmented Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 99,
            padding: 2,
            gap: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <button
            id="topbar-view-receiving"
            onClick={() => setViewMode("receiving")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 99,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
              background:
                viewMode === "receiving"
                  ? "linear-gradient(135deg,#059669,#10b981)"
                  : "transparent",
              color: viewMode === "receiving" ? "#fff" : "var(--text-secondary)",
              boxShadow:
                viewMode === "receiving" ? "0 2px 6px rgba(16,185,129,0.35)" : "none",
            }}
          >
            <Package size={11} /> Store Receiving (Responsibility)
          </button>
          <button
            id="topbar-view-production"
            onClick={() => setViewMode("production")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 99,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
              background:
                viewMode === "production"
                  ? "linear-gradient(135deg,#4f46e5,#6366f1)"
                  : "transparent",
              color: viewMode === "production" ? "#fff" : "var(--text-secondary)",
              boxShadow:
                viewMode === "production" ? "0 2px 6px rgba(99,102,241,0.35)" : "none",
            }}
          >
            <Calendar size={11} /> Production Trends
          </button>
          <button
            id="topbar-view-all"
            onClick={() => setViewMode("all")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 99,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
              background:
                viewMode === "all" ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "transparent",
              color: viewMode === "all" ? "#fff" : "var(--text-secondary)",
              boxShadow: viewMode === "all" ? "0 2px 6px rgba(168,85,247,0.35)" : "none",
            }}
          >
            <Sparkles size={11} /> All (8)
          </button>
        </div>

        {/* Chips row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: viewMode === "all" ? 8 : 12,
            justifyContent: "center",
            flexWrap: "nowrap",
          }}
        >
          {isLoading
            ? currentChips.map((c, i) => (
                <SkeletonChip key={i} gradient={c.gradient} glow={c.glow} size={chipSize} />
              ))
            : currentChips.map((c) => (
                <StatChip
                  key={c.label}
                  label={c.label}
                  sublabel={c.sublabel}
                  value={stats ? stats[c.key] : 0}
                  Icon={c.Icon}
                  gradient={c.gradient}
                  glow={c.glow}
                  size={chipSize}
                />
              ))}
        </div>
      </div>

      {/* RIGHT: Sync badge + action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {syncLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 99,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              background: isError ? "rgba(225,29,72,0.08)" : "rgba(5,150,105,0.08)",
              color: isError ? "#e11d48" : "#059669",
              border: `1px solid ${isError ? "rgba(225,29,72,0.2)" : "rgba(5,150,105,0.2)"}`,
              whiteSpace: "nowrap",
              transition: "opacity 0.3s ease",
            }}
          >
            {isLoading ? (
              <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} />
            ) : isBackgroundFetching ? (
              <RefreshCw
                size={10}
                style={{ animation: "spin 2s linear infinite", opacity: 0.6 }}
              />
            ) : (
              <div className="live-dot" style={{ width: 6, height: 6 }} />
            )}
            {syncLabel}
          </div>
        )}

        <button
          id="topbar-refresh"
          className="topbar-btn"
          onClick={onRefresh}
          disabled={isFetching}
          title="Refresh data"
          style={{ opacity: isFetching ? 0.5 : 1, cursor: isFetching ? "not-allowed" : "pointer" }}
        >
          <RefreshCw size={13} style={isFetching ? { animation: "spin 1s linear infinite" } : {}} />
        </button>

        {mounted && (
          <button
            id="topbar-theme-toggle"
            className="topbar-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}
