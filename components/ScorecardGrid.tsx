"use client";

import { AggregatedStats } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CalendarDays,
  CalendarRange,
  BarChart3,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ScorecardGridProps {
  stats: AggregatedStats | null;
  isLoading: boolean;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = Date.now();
    const from = value;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

interface TrendProps {
  current: number;
  previous: number;
  label?: string;
}

function Trend({ current, previous }: TrendProps) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium ${
        up ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {pct === 0 ? (
        <Minus size={12} />
      ) : up ? (
        <TrendingUp size={12} />
      ) : (
        <TrendingDown size={12} />
      )}
      {pct > 0 ? "+" : ""}
      {pct}% vs prev
    </div>
  );
}

const CARDS = [
  {
    id: "today",
    label: "Today",
    sub: "Pieces produced today",
    icon: Calendar,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/20",
    glowColor: "shadow-violet-500/10",
  },
  {
    id: "week",
    label: "This Week",
    sub: "Mon – Today",
    icon: CalendarDays,
    gradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-400",
    borderColor: "border-indigo-500/20",
    glowColor: "shadow-indigo-500/10",
  },
  {
    id: "month",
    label: "This Month",
    sub: "Calendar month",
    icon: CalendarRange,
    gradient: "from-cyan-500/20 via-teal-500/10 to-transparent",
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    glowColor: "shadow-cyan-500/10",
  },
  {
    id: "quarter",
    label: "This Quarter",
    sub: "Q total pieces",
    icon: BarChart3,
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    glowColor: "shadow-amber-500/10",
  },
  {
    id: "alltime",
    label: "All Time",
    sub: "Grand total produced",
    icon: Users,
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    borderColor: "border-rose-500/20",
    glowColor: "shadow-rose-500/10",
  },
];

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border p-5 glass-card">
      <div className="flex justify-between items-start mb-4">
        <div className="skeleton w-24 h-4 rounded" />
        <div className="skeleton w-9 h-9 rounded-xl" />
      </div>
      <div className="skeleton w-28 h-9 rounded mb-2" />
      <div className="skeleton w-20 h-3 rounded" />
    </div>
  );
}

interface CardProps {
  id: string;
  label: string;
  sub: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  glowColor: string;
  value: number;
  prevValue?: number;
  extra?: React.ReactNode;
}

function ScorecardItem({
  id,
  label,
  sub,
  icon: Icon,
  gradient,
  iconBg,
  iconColor,
  borderColor,
  glowColor,
  value,
  prevValue,
  extra,
}: CardProps) {
  const displayValue = useCountUp(value);

  return (
    <div
      id={`scorecard-${id}`}
      className={`relative rounded-2xl border ${borderColor} p-5 glass-card shadow-lg ${glowColor} overflow-hidden group hover:scale-[1.02] transition-transform duration-200`}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />

      <div className="relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>
          </div>
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon size={16} className={iconColor} />
          </div>
        </div>

        <div className="count-up">
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {displayValue.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground ml-1">pcs</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {prevValue !== undefined && <Trend current={value} previous={prevValue} />}
          {extra}
        </div>
      </div>
    </div>
  );
}

export function ScorecardGrid({ stats, isLoading }: ScorecardGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {CARDS.map((c) => (
          <SkeletonCard key={c.id} />
        ))}
      </div>
    );
  }

  const values = {
    today: stats.todayPieces,
    week: stats.thisWeekPieces,
    month: stats.thisMonthPieces,
    quarter: stats.thisQuarterPieces,
    alltime: stats.allTimePieces,
  };

  const prevValues = {
    today: stats.yesterdayPieces,
    week: stats.lastWeekPieces,
    month: stats.lastMonthPieces,
    quarter: stats.lastQuarterPieces,
    alltime: undefined,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {CARDS.map((card) => (
        <ScorecardItem
          key={card.id}
          {...card}
          value={values[card.id as keyof typeof values]}
          prevValue={prevValues[card.id as keyof typeof prevValues]}
          extra={
            card.id === "alltime" ? (
              <span className="text-xs text-muted-foreground">
                {stats.activeKarigars} karigars
              </span>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
