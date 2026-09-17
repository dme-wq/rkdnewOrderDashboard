"use client";

import { RefreshCw, Layers, Wifi, WifiOff } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useEffect, useState } from "react";

interface HeaderProps {
  lastUpdated: string | null;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

export function Header({ lastUpdated, isLoading, isError, onRefresh }: HeaderProps) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

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
      ? `Synced ${secondsAgo}s ago`
      : `Synced ${Math.floor(secondsAgo / 60)}m ago`
    : "Not synced yet";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-card">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              Karigar Production Dashboard
            </h1>
            <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
              Bathmat Tufting — Live Production Tracker
            </p>
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sync indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isError
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : isLoading
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {isError ? (
              <WifiOff size={12} />
            ) : isLoading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            )}
            {syncLabel}
          </div>

          {/* Refresh button */}
          <button
            id="refresh-button"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
              bg-muted/50 hover:bg-muted border border-border hover:border-primary/40
              text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
