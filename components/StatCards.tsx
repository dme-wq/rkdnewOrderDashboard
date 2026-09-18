"use client";

import { AggregatedStats } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Calendar, CalendarDays, BarChart3, Trophy, Layers } from "lucide-react";
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
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: "1px 5px",
        borderRadius: 99,
        fontSize: 9.5,
        fontWeight: 700,
        background: "rgba(255,255,255,0.20)",
        letterSpacing: "0.01em",
        flexShrink: 0,
      }}
    >
      {same ? <Minus size={8} /> : up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

const GRADIENTS = [
  { from: "#4338ca", to: "#6366f1", shadow: "rgba(79,70,229,0.32)" },
  { from: "#6d28d9", to: "#8b5cf6", shadow: "rgba(109,40,217,0.32)" },
  { from: "#be123c", to: "#e11d48", shadow: "rgba(190,18,60,0.32)" },
  { from: "#b45309", to: "#d97706", shadow: "rgba(180,83,9,0.32)" },
  { from: "#047857", to: "#059669", shadow: "rgba(5,150,105,0.32)" },
];

interface CardDef {
  label: string;
  sub: string;
  gradIdx: number;
  Icon: React.ComponentType<{ size?: number }>;
  value: number;
  prev?: number;
}

function StatCard({ label, sub, gradIdx, Icon, value, prev }: CardDef) {
  const display = useCountUp(value);
  const g = GRADIENTS[gradIdx];

  return (
    <div
      className="fade-up"
      style={{
        background: `linear-gradient(140deg, ${g.from} 0%, ${g.to} 100%)`,
        boxShadow: `0 3px 12px ${g.shadow}`,
        borderRadius: 20,
        padding: "8px 10px 10px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 4,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.03)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 22px ${g.shadow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 3px 12px ${g.shadow}`;
      }}
    >
      {/* Decorative orb */}
      <div
        style={{
          position: "absolute",
          top: -14,
          right: -14,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.10)",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          background: "rgba(255,255,255,0.20)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          position: "relative",
        }}
      >
        <Icon size={12} />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 8.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          opacity: 0.82,
          lineHeight: 1,
          zIndex: 1,
          position: "relative",
        }}
      >
        {label}
      </span>

      {/* Big number */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          zIndex: 1,
          position: "relative",
        }}
      >
        {display.toLocaleString()}
      </div>

      {/* Sub + trend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, zIndex: 1, position: "relative" }}>
        <span style={{ fontSize: 8.5, opacity: 0.65, fontWeight: 500, lineHeight: 1 }}>
          {sub}
        </span>
        {prev !== undefined && <TrendChip current={value} previous={prev} />}
      </div>
    </div>
  );
}

function SkeletonCard({ gradIdx }: { gradIdx: number }) {
  const g = GRADIENTS[gradIdx];
  return (
    <div
      style={{
        background: `linear-gradient(140deg, ${g.from} 0%, ${g.to} 100%)`,
        borderRadius: 20,
        padding: "8px 10px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: 0.6,
      }}
    >
      <div style={{ height: 24, width: 24, background: "rgba(255,255,255,0.20)", borderRadius: 8 }} />
      <div style={{ height: 8, width: "55%", background: "rgba(255,255,255,0.20)", borderRadius: 4 }} />
      <div style={{ height: 18, width: "50%", background: "rgba(255,255,255,0.28)", borderRadius: 4 }} />
      <div style={{ height: 8, width: "40%", background: "rgba(255,255,255,0.14)", borderRadius: 4 }} />
    </div>
  );
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  if (isLoading || !stats) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} gradIdx={i} />)}
      </div>
    );
  }

  const cards: CardDef[] = [
    {
      label: "Today",
      sub: "Pieces produced",
      gradIdx: 0,
      Icon: Calendar,
      value: stats.todayPieces,
      prev: stats.yesterdayPieces,
    },
    {
      label: "This Week",
      sub: "Mon – Today",
      gradIdx: 1,
      Icon: CalendarDays,
      value: stats.thisWeekPieces,
      prev: stats.lastWeekPieces,
    },
    {
      label: "This Month",
      sub: "Calendar month",
      gradIdx: 2,
      Icon: Layers,
      value: stats.thisMonthPieces,
      prev: stats.lastMonthPieces,
    },
    {
      label: "This Quarter",
      sub: "Quarter total",
      gradIdx: 3,
      Icon: BarChart3,
      value: stats.thisQuarterPieces,
      prev: stats.lastQuarterPieces,
    },
    {
      label: "All Time",
      sub: `${stats.activeKarigars} karigars`,
      gradIdx: 4,
      Icon: Trophy,
      value: stats.allTimePieces,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
      {cards.map((c) => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
