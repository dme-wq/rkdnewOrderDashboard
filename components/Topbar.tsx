"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sun, Moon, Calendar, CalendarDays, BarChart3, Layers } from "lucide-react";
import { useTheme } from "next-themes";
import { AggregatedStats } from "@/lib/types";

interface TopbarProps {
  lastUpdated: string | null;
  isLoading: boolean;
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

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ── Single glowing circle chip ───────────────────────────────────────────────
interface ChipDef {
  label: string;
  value: number;
  Icon: React.ComponentType<{ size?: number }>;
  gradient: string;
  glow: string;
}

function StatChip({ label, value, Icon, gradient, glow }: ChipDef) {
  const display = useCountUp(value);

  return (
    <div
      style={{
        background: gradient,
        boxShadow: `0 0 16px ${glow}, 0 3px 10px ${glow}`,
        borderRadius: "50%",
        width: 82,
        height: 82,
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
        gap: 1,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "scale(1.10)";
        el.style.boxShadow = `0 0 28px ${glow}, 0 6px 20px ${glow}`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "scale(1)";
        el.style.boxShadow = `0 0 16px ${glow}, 0 3px 10px ${glow}`;
      }}
    >
      {/* Inner shine */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%)",
        pointerEvents: "none",
      }} />

      {/* Inner dark ring for depth */}
      <div style={{
        position: "absolute", inset: 3, borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.14)",
        pointerEvents: "none",
      }} />

      {/* Icon */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: "rgba(255,255,255,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1, flexShrink: 0, marginBottom: 1,
      }}>
        <Icon size={11} />
      </div>

      {/* Number — animated */}
      <div style={{
        fontSize: 19,
        fontWeight: 900,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        zIndex: 1,
      }}>
        {display.toLocaleString()}
      </div>

      {/* Label */}
      <span style={{
        fontSize: 7,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        opacity: 0.78,
        lineHeight: 1,
        zIndex: 1,
        whiteSpace: "nowrap",
        marginTop: 1,
      }}>
        {label}
      </span>
    </div>
  );
}

function SkeletonChip({ gradient, glow }: { gradient: string; glow: string }) {
  return (
    <div style={{
      background: gradient,
      boxShadow: `0 0 10px ${glow}`,
      borderRadius: "50%",
      width: 82, height: 82,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 4, opacity: 0.45, flexShrink: 0,
    }}>
      <div style={{ width: 20, height: 20, background: "rgba(255,255,255,0.25)", borderRadius: "50%" }} />
      <div style={{ height: 6, width: "52%", background: "rgba(255,255,255,0.22)", borderRadius: 3 }} />
      <div style={{ height: 14, width: "44%", background: "rgba(255,255,255,0.30)", borderRadius: 3 }} />
    </div>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────────────
const CHIP_CONFIG = [
  { label: "Today",    key: "todayPieces"       as const, Icon: Calendar,     gradient: "linear-gradient(140deg,#3730a3,#6366f1)", glow: "rgba(99,102,241,0.50)"  },
  { label: "This Week",key: "thisWeekPieces"    as const, Icon: CalendarDays, gradient: "linear-gradient(140deg,#5b21b6,#8b5cf6)", glow: "rgba(139,92,246,0.50)" },
  { label: "Month",    key: "thisMonthPieces"   as const, Icon: Layers,       gradient: "linear-gradient(140deg,#9f1239,#e11d48)", glow: "rgba(225,29,72,0.50)"  },
  { label: "Quarter",  key: "thisQuarterPieces" as const, Icon: BarChart3,    gradient: "linear-gradient(140deg,#92400e,#d97706)", glow: "rgba(217,119,6,0.50)"  },
];

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

  return (
    <div
      className="topbar"
      style={{ height: 100, paddingLeft: 20, paddingRight: 20, alignItems: "center" }}
    >
      {/* LEFT: Logo + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
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
            fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2,
            background: "linear-gradient(135deg, var(--text-primary) 0%, var(--indigo-light) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            whiteSpace: "nowrap",
          }}>
            RKD New Order Dashboard
          </h1>
          <p style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1, fontWeight: 500, whiteSpace: "nowrap" }}>
            Live production tracker — Bathmat Tufting
          </p>
        </div>
      </div>

      {/* CENTER: Stat Circle Chips */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        flex: 1, justifyContent: "center", padding: "0 20px",
      }}>
        {(isLoading && !stats)
          ? CHIP_CONFIG.map((c, i) => <SkeletonChip key={i} gradient={c.gradient} glow={c.glow} />)
          : CHIP_CONFIG.map((c) => (
              <StatChip
                key={c.label}
                label={c.label}
                value={stats ? stats[c.key] : 0}
                Icon={c.Icon}
                gradient={c.gradient}
                glow={c.glow}
              />
            ))
        }
      </div>

      {/* RIGHT: Sync badge + action buttons */}
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
          id="topbar-refresh" className="topbar-btn" onClick={onRefresh}
          disabled={isLoading} title="Refresh data"
          style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
        >
          <RefreshCw size={13} style={isLoading ? { animation: "spin 1s linear infinite" } : {}} />
        </button>

        {mounted && (
          <button
            id="topbar-theme-toggle" className="topbar-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}
