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
        padding: "1px 4px",
        borderRadius: 99,
        fontSize: 8,
        fontWeight: 700,
        background: "rgba(255,255,255,0.22)",
      }}
    >
      {same ? <Minus size={7} /> : up ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

const GRADIENTS = [
  { from: "#4338ca", to: "#6366f1", shadow: "rgba(79,70,229,0.28)" },
  { from: "#6d28d9", to: "#8b5cf6", shadow: "rgba(109,40,217,0.28)" },
  { from: "#be123c", to: "#e11d48", shadow: "rgba(190,18,60,0.28)" },
  { from: "#b45309", to: "#d97706", shadow: "rgba(180,83,9,0.28)" },
  { from: "#047857", to: "#059669", shadow: "rgba(5,150,105,0.28)" },
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
        boxShadow: `0 2px 8px ${g.shadow}`,
        borderRadius: 16,
        padding: "6px 10px 7px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 2,
        minWidth: 80,
        maxWidth: 110,
        width: "100%",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.04)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 18px ${g.shadow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px ${g.shadow}`;
      }}
    >
      {/* Decorative orb */}
      <div
        style={{
          position: "absolute",
          top: -10,
          right: -10,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.10)",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 6,
          background: "rgba(255,255,255,0.20)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Icon size={10} />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          opacity: 0.80,
          lineHeight: 1,
          zIndex: 1,
          position: "relative",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Big number */}
      <div
        style={{
          fontSize: 18,
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          zIndex: 1,
          position: "relative",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 7.5, opacity: 0.65, fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap" }}>
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
        borderRadius: 16,
        padding: "6px 10px 7px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        opacity: 0.5,
        minWidth: 80,
        maxWidth: 110,
        width: "100%",
      }}
    >
      <div style={{ height: 18, width: 18, background: "rgba(255,255,255,0.22)", borderRadius: 6 }} />
      <div style={{ height: 7, width: "60%", background: "rgba(255,255,255,0.20)", borderRadius: 4 }} />
      <div style={{ height: 16, width: "50%", background: "rgba(255,255,255,0.28)", borderRadius: 4 }} />
      <div style={{ height: 7, width: "45%", background: "rgba(255,255,255,0.14)", borderRadius: 4 }} />
    </div>
  );
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  if (isLoading || !stats) {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} gradIdx={i} />)}
      </div>
    );
  }

  const cards: CardDef[] = [
    {
      label: "Today",
      sub: "Pieces",
      gradIdx: 0,
      Icon: Calendar,
      value: stats.todayPieces,
      prev: stats.yesterdayPieces,
    },
    {
      label: "This Week",
      sub: "Mon–Today",
      gradIdx: 1,
      Icon: CalendarDays,
      value: stats.thisWeekPieces,
      prev: stats.lastWeekPieces,
    },
    {
      label: "This Month",
      sub: "Month",
      gradIdx: 2,
      Icon: Layers,
      value: stats.thisMonthPieces,
      prev: stats.lastMonthPieces,
    },
    {
      label: "This Qtr",
      sub: "Quarter",
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
    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
      {cards.map((c) => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
