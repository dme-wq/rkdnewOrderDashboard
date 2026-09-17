"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ApiResponse, ActiveFilters, ProcessedRow } from "@/lib/types";
import { computeDailyDelta, applyFilters, aggregateStats } from "@/lib/transform";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { StatCards } from "@/components/StatCards";
import { KarigarRanking } from "@/components/KarigarRanking";
import { ChartsRow } from "@/components/ChartsRow";
import { FilterBar } from "@/components/FilterBar";
import { ProductionTable } from "@/components/ProductionTable";
import { AlertTriangle, RefreshCw, Database } from "lucide-react";

const DEFAULT_FILTERS: ActiveFilters = {
  dateFrom: "",
  dateTo: "",
  poNumbers: [],
  designNames: [],
  yarnColors: [],
  karigarNames: [],
};

async function fetchProduction(): Promise<ApiResponse> {
  const res = await fetch("/api/production", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API returned failure");
  return data;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery<ApiResponse>({
    queryKey: ["production"],
    queryFn: fetchProduction,
    refetchInterval: 60 * 1000,
    staleTime: 55 * 1000,
  });

  const processedRows = useMemo<ProcessedRow[]>(() => {
    if (!data?.dataEntry) return [];
    return computeDailyDelta(data.dataEntry, data.productionMaster ?? []);
  }, [data]);

  const filteredRows = useMemo<ProcessedRow[]>(
    () => applyFilters(processedRows, filters),
    [processedRows, filters]
  );

  const stats = useMemo(() => {
    if (filteredRows.length === 0 && !isLoading) return null;
    return aggregateStats(filteredRows);
  }, [filteredRows, isLoading]);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null;
  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["production"] });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <Topbar
          title="Analytics Dashboard"
          subtitle="Live production tracker — Bathmat Tufting"
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          isError={isError}
          onRefresh={handleRefresh}
        />

        {/* Page body */}
        <div style={{ padding: 24, flex: 1 }}>

          {/* Error banner */}
          {isError && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                marginBottom: 20,
              }}
            >
              <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>
                  Data fetch failed
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {error instanceof Error ? error.message : "Unknown error"}
                  {" — Check that your Apps Script is deployed and the URL is correctly set in "}
                  <code
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                  >
                    .env.local
                  </code>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "transparent",
                  color: "#ef4444",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={11} />
                Retry
              </button>
            </div>
          )}

          {/* Loading state — initial with no data */}
          {isLoading && !data && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
                marginBottom: 20,
              }}
            >
              <Database size={14} color="#6366f1" />
              <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 500 }}>
                Fetching live production data from Google Sheet...
              </span>
            </div>
          )}

          {/* ── Stat Cards ── */}
          <StatCards stats={stats} isLoading={isLoading} />

          {/* ── Charts ── */}
          <div style={{ marginTop: 20 }}>
            <ChartsRow stats={stats} isLoading={isLoading} />
          </div>

          {/* ── Top 5 Highest / Lowest Karigars ── */}
          <div style={{ marginTop: 20 }}>
            <KarigarRanking
              leaderboard={stats?.karigarLeaderboard ?? []}
              isLoading={isLoading}
            />
          </div>

          {/* ── Filter Bar + Table ── */}
          <div style={{ marginTop: 20 }}>
            {/* Filter bar (inline, not sticky here since it's inside the page body) */}
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: "12px 16px",
                marginBottom: 16,
              }}
            >
              <FilterBar
                rows={processedRows}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  Production Records
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {filteredRows.length.toLocaleString()} records
                  {filteredRows.length !== processedRows.length &&
                    ` (filtered from ${processedRows.length.toLocaleString()})`}
                </div>
              </div>
            </div>

            <ProductionTable rows={filteredRows} isLoading={isLoading} />
          </div>

          {/* Bottom spacing */}
          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
}
