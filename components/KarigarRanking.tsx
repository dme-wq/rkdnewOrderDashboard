"use client";

import { useState } from "react";
import { KarigarStat } from "@/lib/types";
import { TrendingUp, TrendingDown, Award, AlertTriangle, Calendar, Clock, PieChart } from "lucide-react";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

interface KarigarRankingProps {
  leaderboard: KarigarStat[];
  leaderboardThisWeek?: KarigarStat[];
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
            <div className="skeleton" style={{ height: 10, width: "70%", marginTop: 6, borderRadius: 4 }} />
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
  const accentColor = isTop ? c.bar : c.text;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 0",
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

      {/* Name + bar + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: Name + Total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
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
              fontSize: 14,
              fontWeight: 800,
              color: accentColor,
              fontVariantNumeric: "tabular-nums",
              marginLeft: 8,
              flexShrink: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {stat.totalPieces.toLocaleString()}
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", marginLeft: 2 }}>pcs</span>
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 5,
            background: c.barBg,
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <div
            className="progress-fill"
            style={{ width: `${barWidth}%`, background: accentColor }}
          />
        </div>

        {/* Row 2: Phone + Days + Avg + Contribution % */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 5 }}>
          {stat.phone && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.01em", marginRight: 2 }}>
              {stat.phone}
            </span>
          )}
          {/* Days worked */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2.5px 8px",
              borderRadius: 6,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            <Calendar size={11} color="var(--text-muted)" />
            <span>{stat.lastWeekDays}d worked</span>
          </div>

          {/* Avg/day */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2.5px 8px",
              borderRadius: 6,
              background: isTop ? "rgba(99,102,241,0.09)" : "rgba(225,29,72,0.08)",
              border: `1px solid ${isTop ? "rgba(99,102,241,0.22)" : "rgba(225,29,72,0.20)"}`,
              fontSize: 11.5,
              fontWeight: 800,
              color: accentColor,
              whiteSpace: "nowrap",
            }}
          >
            <Clock size={11} color={accentColor} />
            <span>~{stat.lastWeekAvg.toLocaleString()} avg/day</span>
          </div>

          {/* % Yogdaan / Contribution */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2.5px 8px",
              borderRadius: 6,
              background: isTop ? "rgba(16,185,129,0.10)" : "rgba(249,115,22,0.09)",
              border: `1px solid ${isTop ? "rgba(16,185,129,0.25)" : "rgba(249,115,22,0.22)"}`,
              fontSize: 11.5,
              fontWeight: 800,
              color: isTop ? "#059669" : "#ea580c",
              whiteSpace: "nowrap",
            }}
            title={`${stat.name}'s contribution in last week's total production`}
          >
            <PieChart size={11} color={isTop ? "#059669" : "#ea580c"} />
            <span>{stat.contributionPercent}% share</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Last week Mon–Sun range (same logic as transform.ts) ─────────────────────
function getLastWeekRange(): { label: string } {
  const now = new Date();
  const anyDayLastWeek = subWeeks(now, 1);
  const mon = startOfWeek(anyDayLastWeek, { weekStartsOn: 1 }); // Monday
  const sun = endOfWeek(anyDayLastWeek, { weekStartsOn: 1 });   // Sunday
  const label = `${format(mon, "d MMM")} – ${format(sun, "d MMM yyyy")}`;
  return { label };
}

// ── This week Mon–Sun range ─────────────────────────────────────────────────
function getThisWeekRange(): { label: string } {
  const now = new Date();
  const mon = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const sun = endOfWeek(now, { weekStartsOn: 1 });   // Sunday
  const label = `${format(mon, "d MMM")} – ${format(sun, "d MMM yyyy")}`;
  return { label };
}

export function KarigarRanking({
  leaderboard,
  leaderboardThisWeek = [],
  isLoading,
}: KarigarRankingProps) {
  const [periodTop, setPeriodTop] = useState<"lastWeek" | "thisWeek">("lastWeek");
  const [periodBottom, setPeriodBottom] = useState<"lastWeek" | "thisWeek">("lastWeek");

  const lastWeekLabel = getLastWeekRange().label;
  const thisWeekLabel = getThisWeekRange().label;

  // Active dataset for Top 5
  const activeTopLeaderboard = periodTop === "thisWeek" ? leaderboardThisWeek : leaderboard;
  const top5 = activeTopLeaderboard.slice(0, 5);
  const maxTop = top5[0]?.totalPieces ?? 1;

  // Active dataset for Needs Attention
  const activeBottomLeaderboard = periodBottom === "thisWeek" ? leaderboardThisWeek : leaderboard;
  const bottom5 = [...activeBottomLeaderboard]
    .filter((k) => k.totalPieces > 0)
    .sort((a, b) => a.totalPieces - b.totalPieces)
    .slice(0, 5);
  const maxBot = bottom5[bottom5.length - 1]?.totalPieces ?? 1;

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1px solid var(--border-light)",
    flexWrap: "wrap",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* ── Top 5 Highest ── */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={cardHeaderStyle}>
          {/* Left Title & Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "1 1 auto" }}>
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
                flexShrink: 0,
              }}
            >
              <TrendingUp size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Top 5 Highest
              </div>
              {/* Subtitle: description + dynamic week date range inline */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Most pieces produced</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.5 }}>·</span>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Calendar size={10} color="#059669" />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#059669", letterSpacing: "-0.01em" }}>
                    {periodTop === "thisWeek" ? thisWeekLabel : lastWeekLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls: This Week/Last Week button + Champions badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Toggle Buttons */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "var(--bg-elevated)",
                padding: 2,
                borderRadius: 8,
                border: "1px solid var(--border)",
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={() => setPeriodTop("lastWeek")}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  background: periodTop === "lastWeek" ? "#6366f1" : "transparent",
                  color: periodTop === "lastWeek" ? "#fff" : "var(--text-secondary)",
                  boxShadow: periodTop === "lastWeek" ? "0 1px 4px rgba(99,102,241,0.30)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Last Week
              </button>
              <button
                type="button"
                onClick={() => setPeriodTop("thisWeek")}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  background: periodTop === "thisWeek" ? "#6366f1" : "transparent",
                  color: periodTop === "thisWeek" ? "#fff" : "var(--text-secondary)",
                  boxShadow: periodTop === "thisWeek" ? "0 1px 4px rgba(99,102,241,0.30)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                This Week
              </button>
            </div>

            {/* Badge */}
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
                whiteSpace: "nowrap",
              }}
            >
              <Award size={11} />
              Champions
            </div>
          </div>
        </div>

        {isLoading ? (
          <SkeletonList />
        ) : top5.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No data for {periodTop === "thisWeek" ? "this week" : "last week"}
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

      {/* ── Needs Attention ── */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={cardHeaderStyle}>
          {/* Left Title & Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "1 1 auto" }}>
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
                flexShrink: 0,
              }}
            >
              <TrendingDown size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Needs Attention
              </div>
              {/* Subtitle: description + dynamic week date range inline */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Lowest 5 karigars</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.5 }}>·</span>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Calendar size={10} color="#059669" />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#059669", letterSpacing: "-0.01em" }}>
                    {periodBottom === "thisWeek" ? thisWeekLabel : lastWeekLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls: This Week/Last Week button + Low Output badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Toggle Buttons */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "var(--bg-elevated)",
                padding: 2,
                borderRadius: 8,
                border: "1px solid var(--border)",
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={() => setPeriodBottom("lastWeek")}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  background: periodBottom === "lastWeek" ? "#e11d48" : "transparent",
                  color: periodBottom === "lastWeek" ? "#fff" : "var(--text-secondary)",
                  boxShadow: periodBottom === "lastWeek" ? "0 1px 4px rgba(225,29,72,0.30)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Last Week
              </button>
              <button
                type="button"
                onClick={() => setPeriodBottom("thisWeek")}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  background: periodBottom === "thisWeek" ? "#e11d48" : "transparent",
                  color: periodBottom === "thisWeek" ? "#fff" : "var(--text-secondary)",
                  boxShadow: periodBottom === "thisWeek" ? "0 1px 4px rgba(225,29,72,0.30)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                This Week
              </button>
            </div>

            {/* Badge */}
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
                whiteSpace: "nowrap",
              }}
            >
              <AlertTriangle size={11} />
              Low Output
            </div>
          </div>
        </div>

        {isLoading ? (
          <SkeletonList />
        ) : bottom5.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No data for {periodBottom === "thisWeek" ? "this week" : "last week"}
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
