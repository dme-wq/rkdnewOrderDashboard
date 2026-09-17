"use client";

import { KarigarStat } from "@/lib/types";
import { TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";

interface KarigarRankingProps {
  leaderboard: KarigarStat[];
  isLoading: boolean;
}

const TOP_COLORS = [
  { bg: "rgba(99,102,241,0.12)", text: "#6366f1", border: "rgba(99,102,241,0.25)", bar: "#6366f1" },
  { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", border: "rgba(139,92,246,0.25)", bar: "#8b5cf6" },
  { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.25)", bar: "#10b981" },
  { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.25)", bar: "#3b82f6" },
  { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.25)", bar: "#f59e0b" },
];

const BOT_COLORS = [
  { bg: "rgba(239,68,68,0.10)", text: "#ef4444", border: "rgba(239,68,68,0.2)", bar: "#ef4444" },
  { bg: "rgba(249,115,22,0.10)", text: "#f97316", border: "rgba(249,115,22,0.2)", bar: "#f97316" },
  { bg: "rgba(234,179,8,0.10)", text: "#eab308", border: "rgba(234,179,8,0.2)", bar: "#eab308" },
  { bg: "rgba(239,68,68,0.07)", text: "#f87171", border: "rgba(239,68,68,0.15)", bar: "#f87171" },
  { bg: "rgba(249,115,22,0.07)", text: "#fb923c", border: "rgba(249,115,22,0.15)", bar: "#fb923c" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 6, width: "100%", borderRadius: 99 }} />
          </div>
          <div className="skeleton" style={{ width: 48, height: 20, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

interface KarigarRowProps {
  stat: KarigarStat;
  idx: number;
  maxPieces: number;
  colors: typeof TOP_COLORS;
  showMedal?: boolean;
}

function KarigarRow({ stat, idx, maxPieces, colors, showMedal }: KarigarRowProps) {
  const c = colors[idx];
  const barWidth = maxPieces > 0 ? Math.max(4, (stat.totalPieces / maxPieces) * 100) : 4;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      {/* Avatar */}
      <div
        className="rank-avatar"
        style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}` }}
      >
        {showMedal && idx < 3 ? MEDALS[idx] : stat.initials}
      </div>

      {/* Name + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {stat.name}
          </span>
          <span
            style={{
              fontSize: 13, fontWeight: 700, color: c.text, fontVariantNumeric: "tabular-nums",
              marginLeft: 8, flexShrink: 0,
            }}
          >
            {stat.totalPieces.toLocaleString()}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${barWidth}%`, background: c.bar }}
          />
        </div>
        {stat.phone && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Top 5 Highest */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(99,102,241,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <TrendingUp size={18} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Top 5 Highest
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Most pieces produced</div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "3px 10px",
              borderRadius: 99,
              background: "rgba(99,102,241,0.1)",
              color: "#6366f1",
              fontSize: 11,
              fontWeight: 600,
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <Award size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Champions
          </div>
        </div>

        {isLoading ? (
          <SkeletonList />
        ) : top5.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No data available
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top5.map((stat, idx) => (
              <KarigarRow
                key={stat.fullRaw}
                stat={stat}
                idx={idx}
                maxPieces={maxTop}
                colors={TOP_COLORS}
                showMedal
              />
            ))}
          </div>
        )}
      </div>

      {/* Top 5 Lowest */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(239,68,68,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <TrendingDown size={18} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Needs Attention
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Lowest 5 karigars</div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "3px 10px",
              borderRadius: 99,
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              fontSize: 11,
              fontWeight: 600,
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            <AlertTriangle size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Low Output
          </div>
        </div>

        {isLoading ? (
          <SkeletonList />
        ) : bottom5.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No data available
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bottom5.map((stat, idx) => (
              <KarigarRow
                key={stat.fullRaw}
                stat={stat}
                idx={idx}
                maxPieces={maxBot}
                colors={BOT_COLORS}
                showMedal={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
