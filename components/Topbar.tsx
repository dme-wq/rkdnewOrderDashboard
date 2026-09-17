"use client";

import { RefreshCw, Search, Bell, Sun, Moon } from "lucide-react";
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
      {/* Left side: Logo & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            padding: 2,
          }}
        >
          {/* Using img for simplicity since next/image needs import/config sometimes */}
          <img
            src="https://static.wixstatic.com/media/68b92a_d71e34133826499983234774dea1945b~mv2.png/v1/fill/w_186,h_156,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/RKD-Logo.png"
            alt="RKD Furnishings Logo"
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Sync status */}
        {syncLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              background: isError ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
              color: isError ? "#ef4444" : "#10b981",
              border: `1px solid ${isError ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
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
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh data"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            opacity: isLoading ? 0.5 : 1,
            transition: "all 0.15s",
          }}
        >
          <RefreshCw size={14} style={isLoading ? { animation: "spin 1s linear infinite" } : {}} />
        </button>

        {/* Dark mode toggle */}
        {mounted && (
          <button
            id="topbar-theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        )}

      </div>
    </div>
  );
}
