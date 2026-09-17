"use client";

import { AggregatedStats } from "@/lib/types";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart as HBarChart,
} from "recharts";
import { BarChart2, TrendingUp, Trophy } from "lucide-react";

interface ProductionChartsProps {
  stats: AggregatedStats | null;
  isLoading: boolean;
}

// Unique colors for up to 10 karigars
const KARIGAR_COLORS = [
  "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#a855f7",
];

function SkeletonChart({ height = 220 }: { height?: number }) {
  return (
    <div
      className="skeleton rounded-xl"
      style={{ height }}
    />
  );
}

const customTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
};

export function ProductionCharts({ stats, isLoading }: ProductionChartsProps) {
  const [barMode, setBarMode] = useState<"total" | "byKarigar">("total");

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border glass-card p-5">
          <div className="skeleton w-40 h-5 rounded mb-4" />
          <SkeletonChart height={240} />
        </div>
        <div className="rounded-2xl border border-border glass-card p-5">
          <div className="skeleton w-32 h-5 rounded mb-4" />
          <SkeletonChart height={240} />
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-border glass-card p-5">
          <div className="skeleton w-36 h-5 rounded mb-4" />
          <SkeletonChart height={200} />
        </div>
        <div className="rounded-2xl border border-border glass-card p-5">
          <div className="skeleton w-40 h-5 rounded mb-4" />
          <SkeletonChart height={200} />
        </div>
      </div>
    );
  }

  // Build bar chart data
  const allKarigars = Array.from(
    new Set(stats.dailyTrend.flatMap((d) => Object.keys(d.byKarigar)))
  );

  const barData = stats.dailyTrend.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    total: d.totalPieces,
    ...d.byKarigar,
  }));

  // Weekly line data
  const lineData = stats.weeklyTrend.map((w) => ({
    week: w.weekLabel,
    pieces: w.totalPieces,
  }));

  // Karigar leaderboard
  const leaderboard = stats.karigarLeaderboard.slice(0, 10);
  const leaderboardData = leaderboard.map((k) => ({
    name: k.name,
    pieces: k.totalPieces,
  }));

  const maxPieces = Math.max(...leaderboardData.map((d) => d.pieces), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Daily Bar Chart */}
      <div className="lg:col-span-2 rounded-2xl border border-border glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <BarChart2 size={14} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daily Production</h3>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
          </div>
          {/* Toggle */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border">
            <button
              id="chart-mode-total"
              onClick={() => setBarMode("total")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                barMode === "total"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Total
            </button>
            <button
              id="chart-mode-karigar"
              onClick={() => setBarMode("byKarigar")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                barMode === "byKarigar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              By Karigar
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }} barSize={barMode === "total" ? 20 : 10}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={customTooltipStyle}
              cursor={{ fill: "hsl(var(--muted)/0.3)" }}
            />
            {barMode === "total" ? (
              <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Pieces" />
            ) : (
              allKarigars.map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  stackId="a"
                  fill={KARIGAR_COLORS[i % KARIGAR_COLORS.length]}
                  radius={i === allKarigars.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  name={k}
                />
              ))
            )}
            {barMode === "byKarigar" && allKarigars.length > 0 && <Legend wrapperStyle={{ fontSize: "11px" }} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Line Chart */}
      <div className="rounded-2xl border border-border glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <TrendingUp size={14} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Weekly Trend</h3>
            <p className="text-xs text-muted-foreground">Last 8 weeks</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={customTooltipStyle} />
            <Line
              type="monotone"
              dataKey="pieces"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "hsl(var(--card))" }}
              activeDot={{ r: 6 }}
              name="Pieces"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Karigar Leaderboard */}
      <div className="lg:col-span-3 rounded-2xl border border-border glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Trophy size={14} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Karigar Leaderboard</h3>
            <p className="text-xs text-muted-foreground">Top producers (all-time, filtered)</p>
          </div>
        </div>

        <div className="space-y-3">
          {leaderboard.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
          {leaderboard.map((k, i) => (
            <div key={k.fullRaw} className="flex items-center gap-3">
              {/* Rank + avatar */}
              <div className="flex items-center gap-2 w-8 flex-shrink-0">
                {i < 3 ? (
                  <span className="text-sm font-bold" style={{ color: ["#f59e0b", "#94a3b8", "#b45309"][i] }}>
                    {["🥇", "🥈", "🥉"][i]}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-medium w-5 text-center">{k.rank}</span>
                )}
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: KARIGAR_COLORS[i % KARIGAR_COLORS.length] + "33",
                  color: KARIGAR_COLORS[i % KARIGAR_COLORS.length],
                  border: `1.5px solid ${KARIGAR_COLORS[i % KARIGAR_COLORS.length]}55`,
                }}
              >
                {k.initials}
              </div>
              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{k.name}</span>
                  <span className="text-sm font-bold text-foreground ml-2 tabular-nums flex-shrink-0">
                    {k.totalPieces.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(k.totalPieces / maxPieces) * 100}%`,
                      background: KARIGAR_COLORS[i % KARIGAR_COLORS.length],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
