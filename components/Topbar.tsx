"use client";

import { RefreshCw, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  lastUpdated: string | null;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

export function Topbar({
  title,
  subtitle,
  lastUpdated,
  isLoading,
  isError,
  onRefresh,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
      setSecondsAgo(diff);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const syncLabel = isError
    ? "Sync failed"
    : isLoading
    ? "Syncing..."
    : secondsAgo !== null
    ? secondsAgo < 60
      ? `${secondsAgo}s ago`
      : `${Math.floor(secondsAgo / 60)}m ago`
    : "";

  return (
    <div className="topbar">
      {/* Left: Logo + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            padding: 2,
            border: "1px solid var(--border)",
          }}
        >
          <img
            src="https://static.wixstatic.com/media/68b92a_d71e34133826499983234774dea1945b~mv2.png/v1/fill/w_186,h_156,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/RKD-Logo.png"
            alt="RKD Furnishings Logo"
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </div>

        <div>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              background: "linear-gradient(135deg, var(--text-primary) 0%, var(--indigo-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginTop: 1,
                letterSpacing: "-0.01em",
                fontWeight: 500,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Sync status badge */}
        {syncLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              background: isError
                ? "rgba(225,29,72,0.08)"
                : "rgba(5,150,105,0.08)",
              color: isError ? "#e11d48" : "#059669",
              border: `1px solid ${isError ? "rgba(225,29,72,0.2)" : "rgba(5,150,105,0.2)"}`,
            }}
          >
            {isLoading ? (
              <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <div className="live-dot" style={{ width: 6, height: 6 }} />
            )}
            {syncLabel}
          </div>
        )}

        {/* Refresh */}
        <button
          id="topbar-refresh"
          className="topbar-btn"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh data"
          style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
        >
          <RefreshCw size={14} style={isLoading ? { animation: "spin 1s linear infinite" } : {}} />
        </button>

        {/* Dark mode toggle */}
        {mounted && (
          <button
            id="topbar-theme-toggle"
            className="topbar-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
