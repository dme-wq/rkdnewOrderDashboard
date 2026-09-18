"use client";

import { RefreshCw, Sun, Moon, Calendar, CalendarDays, BarChart3, Trophy, Layers } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AggregatedStats } from "@/lib/types";

interface TopbarProps {
  lastUpdated: string | null;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  stats: AggregatedStats | null;
}

// ── Stat Chip inside Topbar ───────────────────────────────────────────────────

interface ChipDef {
  label: string;
  value: number;
  Icon: React.ComponentType<{ size?: number }>;
  gradient: string;
  glow: string;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    prev.current = target;
    const start = Date.now();
    const from = value;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

// Need useRef
import { useRef } from "react";

function StatChip({ label, value, Icon, gradient, glow }: ChipDef) {
  const display = useCountUp(value);
  return (
    <div
      style={{
        background: gradient,
        boxShadow: `0 0 14px ${glow}, 0 2px 8px ${glow}`,
        borderRadius: 14,
        padding: "5px 10px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        color: "#fff",
        cursor: "default",
        minWidth: 62,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.06)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 22px ${glow}, 0 6px 16px ${glow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px ${glow}, 0 2px 8px ${glow}`;
      }}
    >
      {/* Shine overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
        pointerEvents: "none",
        borderRadius: 14,
      }} />

      <div style={{
        width: 16, height: 16, borderRadius: 6,
        background: "rgba(255,255,255,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1, flexShrink: 0,
      }}>
        <Icon size={9} />
      </div>

      <span style={{
        fontSize: 7, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.07em", opacity: 0.78, lineHeight: 1, zIndex: 1,
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>

      <div style={{
        fontSize: 17, fontWeight: 900, letterSpacing: "-0.04em",
        lineHeight: 1, fontVariantNumeric: "tabular-nums", zIndex: 1,
      }}>
        {display.toLocaleString()}
      </div>
    </div>
  );
}

function SkeletonChip({ gradient, glow }: { gradient: string; glow: string }) {
  return (
    <div style={{
      background: gradient,
      boxShadow: `0 0 10px ${glow}`,
      borderRadius: 14,
      padding: "5px 10px 6px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      minWidth: 62, opacity: 0.55,
    }}>
      <div style={{ width: 16, height: 16, background: "rgba(255,255,255,0.22)", borderRadius: 6 }} />
      <div style={{ height: 6, width: "60%", background: "rgba(255,255,255,0.20)", borderRadius: 3 }} />
      <div style={{ height: 14, width: "50%", background: "rgba(255,255,255,0.28)", borderRadius: 3 }} />
    </div>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────

export function Topbar({ lastUpdated, isLoading, isError, onRefresh, stats }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
      setSecondsAgo(diff);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const syncLabel = isError
    ? "Sync failed"
    : isLoading
    ? "Syncing..."
    : secondsAgo !== null
    ? secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`
    : "";

  const CHIPS: ChipDef[] = stats
    ? [
        { label: "Today",    value: stats.todayPieces,       Icon: Calendar,     gradient: "linear-gradient(135deg,#4338ca,#6366f1)", glow: "rgba(99,102,241,0.5)" },
        { label: "This Week",value: stats.thisWeekPieces,    Icon: CalendarDays, gradient: "linear-gradient(135deg,#6d28d9,#8b5cf6)", glow: "rgba(139,92,246,0.5)" },
        { label: "Month",    value: stats.thisMonthPieces,   Icon: Layers,       gradient: "linear-gradient(135deg,#be123c,#e11d48)", glow: "rgba(225,29,72,0.5)"  },
        { label: "Quarter",  value: stats.thisQuarterPieces, Icon: BarChart3,    gradient: "linear-gradient(135deg,#b45309,#d97706)", glow: "rgba(217,119,6,0.5)"  },
        { label: "All Time", value: stats.allTimePieces,     Icon: Trophy,       gradient: "linear-gradient(135deg,#047857,#059669)", glow: "rgba(5,150,105,0.5)"  },
      ]
    : [];

  const SKELETON_CHIPS = [
    { gradient: "linear-gradient(135deg,#4338ca,#6366f1)", glow: "rgba(99,102,241,0.4)" },
    { gradient: "linear-gradient(135deg,#6d28d9,#8b5cf6)", glow: "rgba(139,92,246,0.4)" },
    { gradient: "linear-gradient(135deg,#be123c,#e11d48)", glow: "rgba(225,29,72,0.4)"  },
    { gradient: "linear-gradient(135deg,#b45309,#d97706)", glow: "rgba(217,119,6,0.4)"  },
    { gradient: "linear-gradient(135deg,#047857,#059669)", glow: "rgba(5,150,105,0.4)"  },
  ];

  return (
    <div className="topbar" style={{ height: 68, paddingLeft: 20, paddingRight: 20 }}>

      {/* LEFT: Logo + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "#fff", padding: 2,
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
        }}>
          <img
            src="https://static.wixstatic.com/media/68b92a_d71e34133826499983234774dea1945b~mv2.png/v1/fill/w_186,h_156,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/RKD-Logo.png"
            alt="RKD Logo"
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </div>
        <div>
          <h1 style={{
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            background: "linear-gradient(135deg, var(--text-primary) 0%, var(--indigo-light) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            whiteSpace: "nowrap",
          }}>
            RKD New Order Dashboard
          </h1>
          <p style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1, fontWeight: 500, whiteSpace: "nowrap" }}>
            Live production tracker — Bathmat Tufting
          </p>
        </div>
      </div>

      {/* CENTER: Stat Chips */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        flex: 1, justifyContent: "center", padding: "0 16px",
      }}>
        {(isLoading && !stats)
          ? SKELETON_CHIPS.map((s, i) => <SkeletonChip key={i} {...s} />)
          : CHIPS.map((c) => <StatChip key={c.label} {...c} />)
        }
      </div>

      {/* RIGHT: Sync + buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {syncLabel && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 99,
            fontSize: 11.5, fontWeight: 600, letterSpacing: "-0.01em",
            background: isError ? "rgba(225,29,72,0.08)" : "rgba(5,150,105,0.08)",
            color: isError ? "#e11d48" : "#059669",
            border: `1px solid ${isError ? "rgba(225,29,72,0.2)" : "rgba(5,150,105,0.2)"}`,
            whiteSpace: "nowrap",
          }}>
            {isLoading
              ? <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} />
              : <div className="live-dot" style={{ width: 6, height: 6 }} />
            }
            {syncLabel}
          </div>
        )}

        <button
          id="topbar-refresh"
          className="topbar-btn"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh data"
          style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
        >
          <RefreshCw size={13} style={isLoading ? { animation: "spin 1s linear infinite" } : {}} />
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
