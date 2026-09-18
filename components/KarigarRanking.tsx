"use client";

import { KarigarStat } from "@/lib/types";
import { TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";

interface KarigarRankingProps {
  leaderboard: KarigarStat[];
  isLoading: boolean;
}

const TOP_PALETTE = [
  { bg: "linear-gradient(135deg, #4338ca, #6366f1)", text: "#ffffff", bar: "#6366f1", barBg: "rgba(99,102,241,0.12)" },
  { bg: "linear-gradient(135deg, #6d28d9, #8b5cf6)", text: "#ffffff", bar: "#8b5cf6", barBg: "rgba(139,92,246,0.12)" },
  { bg: "linear-gradient(135deg, #047857, #10b981)", text: "#ffffff", bar: "#10b981", barBg: "rgba(16,185,129,0.12)" },
  { bg: "linear-gradient(135deg, #1d4ed8, #3b82f6)", text: "#ffffff", bar: "#3b82f6", barBg: "rgba(59,130,246,0.12)" },
  { bg: "linear-gradient(135deg, #b45309, #f59e0b)", text: "#ffffff", bar: "#f59e0b", barBg: "rgba(245,158,11,0.12)" },
];

const BOT_PALETTE = [
  { bg: "rgba(225,29,72,0.12)", text: "#e11d48", bar: "#e11d48", barBg: "rgba(225,29,72,0.08)" },
  { bg: "rgba(249,115,22,0.12)", text: "#f97316", bar: "#f97316", barBg: "rgba(249,115,22,0.08)" },
  { bg: "rgba(234,179,8,0.12)", text: "#ca8a04", bar: "#ca8a04", barBg: "rgba(234,179,8,0.08)" },
  { bg: "rgba(225,29,72,0.08)", text: "#fb7185", bar: "#fb7185", barBg: "rgba(225,29,72,0.06)" },
  { bg: "rgba(249,115,22,0.08)", text: "#fb923c", bar: "#fb923c", barBg: "rgba(249,115,22,0.06)" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 13, width: "55%", marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 6, width: "100%", borderRadius: 99 }} />
          </div>
          <div className="skeleton" style={{ width: 44, height: 22, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

interface KarigarRowProps {
  stat: KarigarStat;
  idx: number;
  maxPieces: number;
  palette: typeof TOP_PALETTE;
  isTop: boolean;
}

function KarigarRow({ stat, idx, maxPieces, palette, isTop }: KarigarRowProps) {
  const c = palette[idx] ?? palette[palette.length - 1];
  const barWidth = maxPieces > 0 ? Math.max(4, (stat.totalPieces / maxPieces) * 100) : 4;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: isTop ? c.bg : (c as typeof BOT_PALETTE[0]).bg,
          color: isTop ? "#fff" : c.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          flexShrink: 0,
          boxShadow: isTop ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
        }}
      >
        {isTop && idx < 3 ? MEDALS[idx] : stat.initials}
      </div>

      {/* Name + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {stat.name}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: isTop ? c.bar : c.text,
              fontVariantNumeric: "tabular-nums",
              marginLeft: 8,
              flexShrink: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {stat.totalPieces.toLocaleString()}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            background: c.barBg,
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            className="progress-fill"
            style={{ width: `${barWidth}%`, background: c.bar }}
          />
        </div>

        {stat.phone && (
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3, letterSpacing: "0.01em" }}>
            {stat.phone}
          </div>
        )}
      </div>
    </div>
  );
}

export function KarigarRanking({ leaderboard, isLoading }: KarigarRankingProps) {
  const top5 = leaderboard.slice(0, 5);
  const bottom5 = [...leaderboard]
    .filter((k) => k.totalPieces > 0)
    .sort((a, b) => a.totalPieces - b.totalPieces)
    .slice(0, 5);

  const maxTop = top5[0]?.totalPieces ?? 1;
  const maxBot = bottom5[bottom5.length - 1]?.totalPieces ?? 1;

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1px solid var(--border-light)",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* Top 5 Highest */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={cardHeaderStyle}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #4338ca, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}
          >
            <TrendingUp size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Top 5 Highest
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Most pieces produced</div>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 99,
              background: "rgba(99,102,241,0.10)",
              color: "#6366f1",
              fontSize: 11,
              fontWeight: 700,
              border: "1px solid rgba(99,102,241,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Award size={11} />
            Champions
          </div>
        </div>

        {isLoading ? (
          <SkeletonList />
        ) : top5.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No data available
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {top5.map((stat, idx) => (
              <KarigarRow
                key={stat.fullRaw}
                stat={stat}
                idx={idx}
                maxPieces={maxTop}
                palette={TOP_PALETTE}
                isTop
              />
            ))}
          </div>
        )}
      </div>

      {/* Needs Attention */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={cardHeaderStyle}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #be123c, #e11d48)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(225,29,72,0.30)",
            }}
          >
            <TrendingDown size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Needs Attention
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Lowest 5 karigars</div>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 99,
              background: "rgba(225,29,72,0.08)",
              color: "#e11d48",
              fontSize: 11,
              fontWeight: 700,
              border: "1px solid rgba(225,29,72,0.18)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <AlertTriangle size={11} />
            Low Output
          </div>
        </div>

        {isLoading ? (
          <SkeletonList />
        ) : bottom5.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No data available
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {bottom5.map((stat, idx) => (
              <KarigarRow
                key={stat.fullRaw}
                stat={stat}
                idx={idx}
                maxPieces={maxBot}
                palette={BOT_PALETTE}
                isTop={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
