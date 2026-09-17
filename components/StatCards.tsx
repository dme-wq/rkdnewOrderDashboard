"use client";

import { AggregatedStats } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface StatCardsProps {
  stats: AggregatedStats | null;
  isLoading: boolean;
}

function useCountUp(target: number, duration = 900) {
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
      const eased = 1 - Math.pow(1 - p, 3);
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
        background: "rgba(255,255,255,0.2)",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {same ? <Minus size={10} /> : up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? "+" : ""}{pct}%
    </div>
  );
}

function SkeletonCard({ color }: { color: string }) {
  return (
    <div className={`stat-card ${color}`} style={{ minHeight: 90 }}>
      <div style={{ height: 10, width: "50%", background: "rgba(255,255,255,0.2)", borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 28, width: "60%", background: "rgba(255,255,255,0.25)", borderRadius: 8, marginBottom: 8 }} />
      <div style={{ height: 10, width: "40%", background: "rgba(255,255,255,0.15)", borderRadius: 6 }} />
    </div>
  );
}

interface CardDef {
  label: string;
  sub: string;
  color: string;
  icon: string;
  value: number;
  prev?: number;
  extra?: string;
}

function StatCard({ label, sub, color, icon, value, prev, extra }: CardDef) {
  const display = useCountUp(value);
  return (
    <div className={`stat-card ${color} fade-up`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </div>
          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>{sub}</div>
        </div>
        <div
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, zIndex: 1, position: "relative",
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>
        {display.toLocaleString()}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {prev !== undefined && <TrendChip current={value} previous={prev} />}
        {extra && <span style={{ fontSize: 9, opacity: 0.75 }}>{extra}</span>}
      </div>
    </div>
  );
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  const colors = ["stat-purple", "stat-violet", "stat-red", "stat-amber", "stat-green"];

  if (isLoading || !stats) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, width: "100%", maxWidth: 1200 }}>
          {colors.map((c) => <SkeletonCard key={c} color={c} />)}
        </div>
      </div>
    );
  }

  const cards: CardDef[] = [
    {
      label: "Today",
      sub: "Pieces produced",
      color: "stat-purple",
      icon: "📅",
      value: stats.todayPieces,
      prev: stats.yesterdayPieces,
    },
    {
      label: "This Week",
      sub: "Mon – Today",
      color: "stat-violet",
      icon: "📆",
      value: stats.thisWeekPieces,
      prev: stats.lastWeekPieces,
    },
    {
      label: "This Month",
      sub: "Calendar month",
      color: "stat-red",
      icon: "🗓️",
      value: stats.thisMonthPieces,
      prev: stats.lastMonthPieces,
    },
    {
      label: "This Quarter",
      sub: "Quarter total",
      color: "stat-amber",
      icon: "📊",
      value: stats.thisQuarterPieces,
      prev: stats.lastQuarterPieces,
    },
    {
      label: "All Time",
      sub: "Grand total",
      color: "stat-green",
      icon: "🏆",
      value: stats.allTimePieces,
      extra: `${stats.activeKarigars} active karigars`,
    },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, width: "100%", maxWidth: 1200 }}>
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
}
