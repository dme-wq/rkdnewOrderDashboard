"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ApiResponse, ActiveFilters, ProcessedRow } from "@/lib/types";
import { computeDailyDelta, applyFilters, aggregateStats } from "@/lib/transform";
import { Topbar } from "@/components/Topbar";
import { StatCards } from "@/components/StatCards";
import { KarigarRanking } from "@/components/KarigarRanking";
import { ChartsRow } from "@/components/ChartsRow";

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

// Client-side fetcher — always fetches fresh, no caching
async function fetchProductionClient(): Promise<ApiResponse> {
  const proxyUrl = new URL("/api/production", window.location.origin);
  // Unique timestamp every call — bypasses browser HTTP cache
  proxyUrl.searchParams.append("t", Date.now().toString());

  const proxyRes = await fetch(proxyUrl.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!proxyRes.ok) {
    throw new Error(`API returned HTTP ${proxyRes.status}`);
  }

  const data = await proxyRes.json();
  if (!data.success) throw new Error(data.error || "Failed to load data");
  return data;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery<ApiResponse>({
    queryKey: ["production"],
    queryFn: fetchProductionClient,
    refetchInterval: 10 * 1000,   // Re-fetch every 10 seconds
    staleTime: 0,                  // Data is always considered stale — refetch immediately
    gcTime: 0,                     // Don't keep old data in memory cache
    refetchOnWindowFocus: true,    // Refetch when user switches back to tab
    refetchOnReconnect: true,      // Refetch on network reconnect
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

  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", width: "100%" }}>
      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        <Topbar
          title="Analytics Dashboard"
          subtitle="Live production tracker — Bathmat Tufting"
          lastUpdated={lastUpdated}
          isLoading={isLoading && !data} // Only show loading spinner if we don't have data
          isError={isError}
          onRefresh={handleRefresh}
        />

        <div style={{ padding: 24, flex: 1 }}>
          {/* Error banner */}
          {isError && (
            <div
              style={{
                borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                marginBottom: 20,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px" }}>
                <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>
                    Data fetch failed
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {errorMessage}
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6,
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "transparent", color: "#ef4444",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            </div>
          )}



          {/* Stat Cards */}
          <StatCards stats={stats} isLoading={isLoading && !data} />

          {/* Charts */}
          <div style={{ marginTop: 20 }}>
            <ChartsRow stats={stats} isLoading={isLoading && !data} />
          </div>

          {/* Top 5 / Bottom 5 Karigars */}
          <div style={{ marginTop: 20 }}>
            <KarigarRanking
              leaderboard={stats?.karigarLeaderboard ?? []}
              isLoading={isLoading && !data}
            />
          </div>

          {/* Table */}
          <div style={{ marginTop: 20 }}>
            <ProductionTable
              rows={filteredRows}
              allRows={processedRows}
              filters={filters}
              onFiltersChange={setFilters}
              isLoading={isLoading && !data}
            />
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
}
