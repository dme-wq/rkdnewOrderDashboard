"use client";

import { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  Sun,
  Moon,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  BarChart3,
  Award,
  Layers,
  GitMerge,
  ChevronDown,
  ChevronUp,
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

// ── Animated count-up hook ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 650) {
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

// ── Professional Executive Stat Card ─────────────────────────────────────────
interface ProCardDef {
  label: string;
  value: number;
  Icon: React.ComponentType<{ size?: number }>;
  accentColor?: string;
  accentBg?: string;
  gradient?: string;
}

// Card accent configs — one per scorecard (Google Search Console theme with signature underline)
const CARD_ACCENTS: Record<string, { color: string; border: string }> = {
  "Today Total":      { color: "#2563eb", border: "rgba(37,99,235,0.22)" },
  "Yesterday Total":  { color: "#7c3aed", border: "rgba(124,58,237,0.22)" },
  "This Week Total":  { color: "#0891b2", border: "rgba(8,145,178,0.22)" },
  "Last Week Total":  { color: "#4f46e5", border: "rgba(79,70,229,0.22)" },
  "This Month Total": { color: "#059669", border: "rgba(5,150,105,0.22)" },
  "This Month":       { color: "#059669", border: "rgba(5,150,105,0.22)" },
  "Last Month Total": { color: "#c026d3", border: "rgba(192,38,211,0.22)" },
  "Last Month":       { color: "#c026d3", border: "rgba(192,38,211,0.22)" },
  "Loop + Cut":       { color: "#8b5cf6", border: "rgba(139,92,246,0.22)" },
  "Full Piece + Cut": { color: "#10b981", border: "rgba(16,185,129,0.22)" },
  "Grand Total":      { color: "#f59e0b", border: "rgba(245,158,11,0.25)" },
};

function ProfessionalScorecard({ label, value }: ProCardDef) {
  const display = useCountUp(value);
  const accent = CARD_ACCENTS[label] ?? { color: "#f59e0b", border: "rgba(245,158,11,0.25)" };

  return (
    <div
      className="pro-stat-card"
      style={{
        flex: "0 0 auto",
        minWidth: 114,
        maxWidth: 148,
        height: 65,
        padding: "7px 11px 7px 11px",
        borderRadius: 10,
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
        e.currentTarget.style.borderColor = accent.color;
        e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.07)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top section: Label + Signature Underline Accent Bar */}
      <div>
        <div
          style={{
            fontSize: 10.5,
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
            width: 24,
            height: 3,
            borderRadius: 99,
            background: accent.color,
            marginTop: 3.5,
          }}
        />
      </div>

      {/* Bottom section: Bold, prominent tabular number */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 3.5 }}>
        <span
          style={{
            fontSize: 19,
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
            fontSize: 9,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          pcs
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        flex: "0 0 auto",
        minWidth: 114,
        maxWidth: 148,
        height: 65,
        padding: "7px 11px 7px 11px",
        borderRadius: 10,
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: 0.6,
      }}
    >
      <div>
        <div className="skeleton" style={{ height: 10.5, width: "65%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 3, width: 24, borderRadius: 99, marginTop: 3.5 }} />
      </div>
      <div className="skeleton" style={{ height: 19, width: "50%", borderRadius: 4 }} />
    </div>
  );
}

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
  // Auto-hide scorecards by default as requested; user can toggle anytime
  const [showScorecards, setShowScorecards] = useState(false);

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

  const mainCards: ProCardDef[] = [
    {
      label: "Today Total",
      value: stats?.todayPieces ?? 0,
      Icon: Calendar,
    },
    {
      label: "Yesterday Total",
      value: stats?.yesterdayPieces ?? 0,
      Icon: CalendarDays,
    },
    {
      label: "This Week Total",
      value: stats?.thisWeekPieces ?? 0,
      Icon: BarChart3,
    },
    {
      label: "Last Week Total",
      value: stats?.lastWeekPieces ?? 0,
      Icon: Clock,
    },
    {
      label: "This Month Total",
      value: stats?.thisMonthPieces ?? 0,
      Icon: CalendarRange,
    },
    {
      label: "Last Month Total",
      value: stats?.lastMonthPieces ?? 0,
      Icon: Calendar,
    },
    {
      label: "Loop + Cut",
      value: stats ? (stats.loopCutPieces ?? (stats.loopPieces + stats.cutPieces)) : 0,
      Icon: GitMerge,
    },
    {
      label: "Full Piece + Cut",
      value: stats ? (stats.fullPieceCutPieces ?? (stats.fullPiecePieces + stats.cutPieces)) : 0,
      Icon: Layers,
    },
    {
      label: "Grand Total",
      value: stats?.grandTotalStoreReceiving ?? 0,
      Icon: Award,
    },
  ];

  return (
    <div
      className="topbar"
      style={{
        minHeight: showScorecards ? 86 : 58,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 8,
        paddingBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
        transition: "min-height 0.22s ease",
      }}
    >
      {/* LEFT: Logo & Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "#fff",
            padding: 2,
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            RKD Furnishings
          </div>
          <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 600 }}>
            Production Dashboard
          </div>
        </div>
      </div>

      {/* CENTER: Scorecard Toggle Button or Expanded Scorecards */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          justifyContent: "center",
          flexWrap: "nowrap",
          overflowX: "auto",
        }}
      >
        {!showScorecards ? (
          <button
            id="btn-show-scorecards"
            onClick={() => setShowScorecards(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 18px",
              borderRadius: 99,
              background: "rgba(99, 102, 241, 0.08)",
              border: "1.5px solid rgba(99, 102, 241, 0.28)",
              color: "#6366f1",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 2px 8px rgba(99,102,241,0.12)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.14)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <BarChart3 size={14} />
            <span>View Scorecards</span>
            <span
              style={{
                background: "#6366f1",
                color: "#fff",
                borderRadius: 99,
                padding: "1px 7px",
                fontSize: 10.5,
                fontWeight: 800,
                lineHeight: "14px",
              }}
            >
              {mainCards.length}
            </span>
            <ChevronDown size={13} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", maxWidth: "100%", padding: "2px 0" }}>
            {isLoading
              ? Array.from({ length: mainCards.length }).map((_, i) => <SkeletonCard key={i} />)
              : mainCards.map((card) => (
                  <ProfessionalScorecard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    Icon={card.Icon}
                  />
                ))}
            {/* Collapse Button */}
            <button
              id="btn-hide-scorecards"
              onClick={() => setShowScorecards(false)}
              title="Hide Scorecards"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 11px",
                borderRadius: 9,
                background: "var(--bg-card)",
                border: "1.5px solid var(--border)",
                color: "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <ChevronUp size={13} />
              <span>Hide</span>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Sync badge + action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {syncLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
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
