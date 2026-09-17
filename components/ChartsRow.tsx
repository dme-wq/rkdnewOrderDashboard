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
  LineChart,
  Line,
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
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 12,
  color: "var(--text-primary)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
};

function SkeletonChart({ height = 200 }: { height?: number }) {
  return <div className="skeleton" style={{ height, borderRadius: 8 }} />;
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export function ChartsRow({ stats, isLoading }: ChartsRowProps) {
  const [barMode, setBarMode] = useState<"total" | "byKarigar">("total");

  if (isLoading || !stats) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="skeleton" style={{ height: 16, width: 160, borderRadius: 6, marginBottom: 16 }} />
          <SkeletonChart height={200} />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="skeleton" style={{ height: 16, width: 120, borderRadius: 6, marginBottom: 16 }} />
          <SkeletonChart height={200} />
        </div>
      </div>
    );
  }

  const allKarigars = Array.from(
    new Set(stats.dailyTrend.flatMap((d) => Object.keys(d.byKarigar)))
  );

  const barData = stats.dailyTrend.map((d) => ({
    date: d.date.slice(5),
    total: d.totalPieces,
    ...d.byKarigar,
  }));

  const lineData = stats.weeklyTrend.map((w) => ({
    week: w.weekLabel.replace(" 2026", ""),
    pieces: w.totalPieces,
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      {/* Daily Bar Chart */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <SectionHeader title="Daily Production" sub="Last 14 days — piece count" />
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "var(--bg)",
              borderRadius: 8,
              padding: 4,
              border: "1px solid var(--border)",
            }}
          >
            {(["total", "byKarigar"] as const).map((mode) => (
              <button
                key={mode}
                id={`chart-${mode}`}
                onClick={() => setBarMode(mode)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: barMode === mode ? "#6366f1" : "transparent",
                  color: barMode === mode ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {mode === "total" ? "Total" : "By Karigar"}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={barMode === "total" ? 18 : 8}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
            {barMode === "total" ? (
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Pieces" />
            ) : (
              allKarigars.map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  stackId="a"
                  fill={KARIGAR_COLORS[i % KARIGAR_COLORS.length]}
                  radius={i === allKarigars.length - 1 ? [4, 4, 0, 0] : undefined}
                  name={k}
                />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Area Chart */}
      <div className="card" style={{ padding: 20 }}>
        <SectionHeader title="Weekly Trend" sub="Last 8 weeks production" />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={lineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="pieces"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#weeklyGradient)"
              dot={{ r: 4, fill: "#6366f1", stroke: "var(--bg-card)", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name="Pieces"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
