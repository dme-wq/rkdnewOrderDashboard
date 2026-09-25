"use client";

import { Layers, Users, FileText, Filter } from "lucide-react";

interface TableMiniStatsProps {
  totalPieces: number;
  karigarCount: number;
  recordCount: number;
  isLoading: boolean;
  hasFilter: boolean;
}

function SkeletonPill() {
  return <div className="skeleton" style={{ height: 52, borderRadius: 14, width: "100%" }} />;
}

export function TableMiniStats({
  totalPieces,
  karigarCount,
  recordCount,
  isLoading,
  hasFilter,
}: TableMiniStatsProps) {
  const cards = [
    {
      id: "stat-records",
      label: "Records Shown",
      value: recordCount.toLocaleString(),
      icon: FileText,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.10)",
      border: "rgba(99,102,241,0.18)",
    },
    {
      id: "stat-pieces",
      label: "Total Pieces",
      value: totalPieces.toLocaleString(),
      icon: Layers,
      color: "#059669",
      bg: "rgba(5,150,105,0.10)",
      border: "rgba(5,150,105,0.18)",
    },
    {
      id: "stat-karigars",
      label: "Active Karigars",
      value: karigarCount.toLocaleString(),
      icon: Users,
      color: "#d97706",
      bg: "rgba(217,119,6,0.10)",
      border: "rgba(217,119,6,0.18)",
    },
  ];

  return (
    <div
      style={{
        borderRadius: 16,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        padding: "14px 18px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: hasFilter ? "rgba(99,102,241,0.12)" : "var(--bg-elevated)",
            border: `1px solid ${hasFilter ? "rgba(99,102,241,0.25)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Filter
            size={13}
            color={hasFilter ? "#6366f1" : "var(--text-muted)"}
            style={{ flexShrink: 0 }}
          />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: hasFilter ? "#6366f1" : "var(--text-secondary)",
            letterSpacing: "-0.01em",
          }}
        >
          {hasFilter ? "Filtered View Summary" : "Full Dataset Summary"}
        </span>
        {hasFilter && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6366f1",
              background: "rgba(99,102,241,0.10)",
              border: "1px solid rgba(99,102,241,0.20)",
              borderRadius: 99,
              padding: "1px 7px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Filter Active
          </span>
        )}
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonPill key={i} />)
          : cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  id={card.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 2px 8px ${card.border}`,
                    }}
                  >
                    <Icon size={15} color={card.color} strokeWidth={2.5} />
                  </div>
                  {/* Text */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: card.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: 1,
                      }}
                    >
                      {card.label}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: card.color,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                      }}
                    >
                      {card.value}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
