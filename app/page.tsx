"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ApiResponse, ActiveFilters, ProcessedRow } from "@/lib/types";
import { computeDailyDelta, applyFilters, aggregateStats } from "@/lib/transform";
import { Topbar } from "@/components/Topbar";
import { KarigarRanking } from "@/components/KarigarRanking";
import { ChartsRow } from "@/components/ChartsRow";
import { ProductionTable } from "@/components/ProductionTable";
import { TableMiniStats } from "@/components/TableMiniStats";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
  proxyUrl.searchParams.append("t", Date.now().toString());

  const proxyRes = await fetch(proxyUrl.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  if (!proxyRes.ok) throw new Error(`API returned HTTP ${proxyRes.status}`);
  const data = await proxyRes.json();
  if (!data.success) throw new Error(data.error || "Failed to load data");
  return data;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  // isLoading  = true only on FIRST load (no cached data yet)
  // isFetching = true on every background refetch too
  const { data, isLoading, isFetching, isError, error, dataUpdatedAt } = useQuery<ApiResponse>({
    queryKey: ["production"],
    queryFn: fetchProductionClient,
    refetchInterval: 60 * 1000,          // refetch every 60s (not 5s — was hammering API)
    refetchIntervalInBackground: false,   // don't refetch when tab is hidden
    staleTime: 30 * 1000,                // data stays fresh 30s — no unnecessary refetches
    gcTime: 5 * 60 * 1000,              // keep in cache 5 min
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // ── All processed rows (no filter applied) ───────────────────────────────────
  const processedRows = useMemo<ProcessedRow[]>(() => {
    if (!data?.dataEntry) return [];
    return computeDailyDelta(data.dataEntry, data.productionMaster ?? []);
  }, [data]);

  // ── Filtered rows for the data table ─────────────────────────────────────────
  const filteredRows = useMemo<ProcessedRow[]>(
    () => applyFilters(processedRows, filters),
    [processedRows, filters]
  );

  // ── GLOBAL stats — always computed from ALL data, independent of table filters
  // This is what Topbar chips + Charts use. Never changes when table filter changes.
  const globalStats = useMemo(() => {
    if (processedRows.length === 0 && !isLoading) return null;
    return aggregateStats(processedRows);
  }, [processedRows, isLoading]);

  // ── TABLE stats — computed from FILTERED rows only
  // Used by the mini scorecard above the table.
  const tableTotalPieces = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.dailyPiecesMade, 0),
    [filteredRows]
  );
  const tableKarigarCount = useMemo(
    () => new Set(filteredRows.map((r) => r.karigarInfo.name).filter(Boolean)).size,
    [filteredRows]
  );
  const tableRecordCount = filteredRows.length;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null;
  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["production"] });
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", width: "100%" }}>
      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>

        {/* ── Sticky Topbar — GLOBAL stats chips (always full data) ── */}
        <Topbar
          lastUpdated={lastUpdated}
          isLoading={isLoading}        // true ONLY on first load, not background refetches
          isFetching={isFetching}      // true during any fetch (used for subtle spinner)
          isError={isError}
          onRefresh={handleRefresh}
          stats={globalStats}
        />

        <div style={{ padding: 24, flex: 1 }}>

          {/* Error banner */}
          {isError && (
            <div style={{
              borderRadius: 12, background: "rgba(225,29,72,0.07)",
              border: "1px solid rgba(225,29,72,0.18)", marginBottom: 20, overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px" }}>
                <AlertTriangle size={15} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e11d48", marginBottom: 3 }}>Data fetch failed</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{errorMessage}</div>
                </div>
                <button
                  onClick={handleRefresh}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6,
                    border: "1px solid rgba(225,29,72,0.3)",
                    background: "transparent", color: "#e11d48",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            </div>
          )}

          {/* ── Charts — GLOBAL (independent of table filters) ── */}
          <ChartsRow stats={globalStats} isLoading={isLoading} />

          {/* ── Karigar Rankings — GLOBAL ── */}
          <div style={{ marginTop: 20 }}>
            <KarigarRanking
              leaderboard={globalStats?.karigarLeaderboard ?? []}
              isLoading={isLoading}
            />
          </div>

          {/* ── Mini Scorecard — LINKED to table filters ── */}
          <div style={{ marginTop: 20 }}>
            <TableMiniStats
              totalPieces={tableTotalPieces}
              karigarCount={tableKarigarCount}
              recordCount={tableRecordCount}
              isLoading={isLoading}
              hasFilter={
                !!(filters.dateFrom || filters.poNumbers.length || filters.designNames.length ||
                  filters.yarnColors.length || filters.karigarNames.length)
              }
            />
          </div>

          {/* ── Data Table — shows filteredRows ── */}
          <div style={{ marginTop: 10 }}>
            <ProductionTable
              rows={filteredRows}
              allRows={processedRows}
              filters={filters}
              onFiltersChange={setFilters}
              isLoading={isLoading}
            />
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
}
