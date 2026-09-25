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
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface ChartsRowProps {
  stats: AggregatedStats | null;
  isLoading: boolean;
}

const KARIGAR_COLORS = [
  "#6366f1","#8b5cf6","#3b82f6","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#f97316","#ec4899","#a855f7",
];

const tooltipStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
  color: "var(--text-primary)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
};

function SkeletonChart({ height = 200 }: { height?: number }) {
  return <div className="skeleton" style={{ height, borderRadius: 10 }} />;
}

export function ChartsRow({ stats, isLoading }: ChartsRowProps) {
  const [barMode, setBarMode] = useState<"total" | "byKarigar">("total");

  if (isLoading || !stats) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <div className="card" style={{ padding: "20px 22px" }}>
          <div className="skeleton" style={{ height: 16, width: 180, borderRadius: 6, marginBottom: 20 }} />
          <SkeletonChart height={200} />
        </div>
        <div className="card" style={{ padding: "20px 22px" }}>
          <div className="skeleton" style={{ height: 16, width: 140, borderRadius: 6, marginBottom: 20 }} />
          <SkeletonChart height={200} />
        </div>
      </div>
    );
  }

  const allKarigars = Array.from(
    new Set(stats.dailyTrend.flatMap((d) => Object.keys(d.byKarigar)))
  );

  const barData = stats.dailyTrend.map((d) => {
    const parts = d.date.split("-");
    const shortDate = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : d.date;
    return { date: shortDate, total: d.totalPieces, ...d.byKarigar };
  });

  const lineData = stats.weeklyTrend.map((w) => ({
    week: w.weekLabel.replace(/\s\d{4}$/, ""),
    pieces: w.totalPieces,
  }));

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: "1px solid var(--border-light)",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
      {/* Daily Bar Chart */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={cardHeaderStyle}>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Daily Production
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Last 14 days — piece count
            </div>
          </div>

          {/* Mode toggle */}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "var(--bg-elevated)",
              borderRadius: 10,
              padding: 3,
              border: "1px solid var(--border)",
            }}
          >
            {(["total", "byKarigar"] as const).map((mode) => (
              <button
                key={mode}
                id={`chart-${mode}`}
                onClick={() => setBarMode(mode)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 11.5,
                  fontWeight: 700,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                  background: barMode === mode ? "var(--indigo)" : "transparent",
                  color: barMode === mode ? "#fff" : "var(--text-secondary)",
                  boxShadow: barMode === mode ? "0 2px 8px rgba(79,70,229,0.30)" : "none",
                }}
              >
                {mode === "total" ? "Total" : "By Karigar"}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barSize={barMode === "total" ? 20 : 8}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
            {barMode === "total" ? (
              <Bar dataKey="total" fill="url(#barGradient)" radius={[5, 5, 0, 0]} name="Pieces" />
            ) : (
              allKarigars.map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  stackId="a"
                  fill={KARIGAR_COLORS[i % KARIGAR_COLORS.length]}
                  radius={i === allKarigars.length - 1 ? [5, 5, 0, 0] : undefined}
                  name={k}
                />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Area Chart */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border-light)" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Weekly Trend
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Last 8 weeks production</div>
        </div>

        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={lineData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9.5, fill: "var(--text-muted)", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="pieces"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#weeklyGradient)"
              dot={{ r: 4, fill: "#6366f1", stroke: "var(--bg-card)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#6366f1", stroke: "var(--bg-card)", strokeWidth: 2 }}
              name="Pieces"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
