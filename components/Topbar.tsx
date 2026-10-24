"use client";

import { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  Sun,
  Moon,
  Calendar,
  CalendarDays,
  BarChart3,
  Award,
  Layers,
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
}

function ProfessionalScorecard({ label, value, Icon }: ProCardDef) {
  const display = useCountUp(value);

  return (
    <div
      className="pro-stat-card"
      style={{
        flex: "1 1 0",
        minWidth: 155,
        maxWidth: 220,
        height: 76,
        padding: "10px 14px",
        borderRadius: 12,
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Header: Label + Icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span
          style={{
            fontSize: 10.5,
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
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "rgba(99, 102, 241, 0.10)",
            color: "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={12} />
        </div>
      </div>

      {/* Bottom Value: Big Number + Pcs suffix */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontSize: 22,
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
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
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
        flex: "1 1 0",
        minWidth: 155,
        maxWidth: 220,
        height: 76,
        padding: "10px 14px",
        borderRadius: 12,
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: 0.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ height: 10, width: "60%", background: "var(--border)", borderRadius: 4 }} />
        <div style={{ width: 22, height: 22, background: "var(--border)", borderRadius: 6 }} />
      </div>
      <div style={{ height: 20, width: "45%", background: "var(--border)", borderRadius: 4 }} />
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

  // The 5 Main Scorecards explicitly requested by the user:
  // 1. Today Total
  // 2. Yesterday Total
  // 3. Weekly Total
  // 4. Grand Total
  // 5. Full Piece + Cut
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
      label: "Weekly Total",
      value: stats?.thisWeekPieces ?? 0,
      Icon: BarChart3,
    },
    {
      label: "Grand Total",
      value: stats?.grandTotalStoreReceiving ?? 0,
      Icon: Award,
    },
    {
      label: "Full Piece + Cut",
      value: stats ? stats.fullPiecePieces + stats.cutPieces : 0,
      Icon: Layers,
    },
  ];

  return (
    <div
      className="topbar"
      style={{
        minHeight: 90,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* LEFT: Logo & Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
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

      {/* CENTER: 5 Professional Main Scorecards */}
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
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : mainCards.map((card) => (
              <ProfessionalScorecard
                key={card.label}
                label={card.label}
                value={card.value}
                Icon={card.Icon}
              />
            ))}
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
