"use client";

import { AggregatedStats } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Calendar, CalendarDays, BarChart3, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface StatCardsProps {
  stats: AggregatedStats | null;
  isLoading: boolean;
}

function useCountUp(target: number, duration = 1000) {
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

function TrendChip({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct > 0;
  const same = pct === 0;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 7px",
        borderRadius: 99,
        background: "rgba(255,255,255,0.22)",
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.01em",
      }}
    >
      {same ? <Minus size={9} /> : up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {up ? "+" : ""}{pct}%
    </div>
  );
}

function SkeletonCard({ color }: { color: string }) {
  return (
    <div
      className={`stat-card ${color}`}
      style={{ minHeight: 90, display: "flex", flexDirection: "column", justifyContent: "center", padding: "14px 16px" }}
    >
      <div style={{ height: 10, width: "50%", background: "rgba(255,255,255,0.18)", borderRadius: 6, marginBottom: 10 }} />
      <div style={{ height: 26, width: "65%", background: "rgba(255,255,255,0.26)", borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 10, width: "35%", background: "rgba(255,255,255,0.14)", borderRadius: 6 }} />
    </div>
  );
}

interface CardDef {
  label: string;
  sub: string;
  color: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  value: number;
  prev?: number;
  extra?: string;
}

function StatCard({ label, sub, color, Icon, value, prev }: CardDef) {
  const display = useCountUp(value);
  return (
    <div
      className={`stat-card ${color} fade-up`}
      style={{ display: "flex", flexDirection: "column", padding: "16px 18px", minHeight: 90 }}
    >
      {/* Icon + label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={13} />
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            opacity: 0.88,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </span>
      </div>

      {/* Big number */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginBottom: 8,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display.toLocaleString()}
      </div>

      {/* Sub + trend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
        <span style={{ fontSize: 11, opacity: 0.72, fontWeight: 500 }}>{sub}</span>
        {prev !== undefined && <TrendChip current={value} previous={prev} />}
      </div>
    </div>
  );
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  const colors = ["stat-purple", "stat-violet", "stat-red", "stat-amber", "stat-green"];

  if (isLoading || !stats) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {colors.map((c) => <SkeletonCard key={c} color={c} />)}
      </div>
    );
  }

  const cards: CardDef[] = [
    {
      label: "Today",
      sub: "Pieces produced",
      color: "stat-purple",
      Icon: Calendar,
      value: stats.todayPieces,
      prev: stats.yesterdayPieces,
    },
    {
      label: "This Week",
      sub: "Mon – Today",
      color: "stat-violet",
      Icon: CalendarDays,
      value: stats.thisWeekPieces,
      prev: stats.lastWeekPieces,
    },
    {
      label: "This Month",
      sub: "Calendar month",
      color: "stat-red",
      Icon: CalendarDays,
      value: stats.thisMonthPieces,
      prev: stats.lastMonthPieces,
    },
    {
      label: "This Quarter",
      sub: "Quarter total",
      color: "stat-amber",
      Icon: BarChart3,
      value: stats.thisQuarterPieces,
      prev: stats.lastQuarterPieces,
    },
    {
      label: "All Time",
      sub: `${stats.activeKarigars} active karigars`,
      color: "stat-green",
      Icon: Trophy,
      value: stats.allTimePieces,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
      {cards.map((c) => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
