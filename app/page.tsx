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

// ── Smart fetch: tries server proxy first, then direct client-side fetch ──────
async function fetchProduction(): Promise<ApiResponse> {
  const DIRECT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

  // 1. Try the server-side proxy (avoids CORS, works for public scripts)
  try {
    const proxyRes = await fetch("/api/production", {
      cache: "no-store",
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.success) return data;
      // If proxy gives us a detail about the error, log it
      console.warn("[Proxy] Apps Script error:", data.error, data.detail ?? "");
    }
  } catch (proxyErr) {
    console.warn("[Proxy] Server proxy failed:", proxyErr);
  }

  // 2. Fallback: call Apps Script directly from browser (works when CORS allowed)
  if (!DIRECT_URL) {
    throw new Error(
      "NEXT_PUBLIC_APPS_SCRIPT_URL is not set. Add it to Vercel environment variables and redeploy."
    );
  }

  try {
    const directRes = await fetch(DIRECT_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!directRes.ok) {
      throw new Error(
        `Apps Script HTTP ${directRes.status}. Make sure the script is deployed with "Who has access: Anyone" (not domain-restricted).`
      );
    }

    const data = await directRes.json();
    if (!data.success) throw new Error(data.error || "Apps Script returned failure");
    return data;
  } catch (directErr) {
    if (directErr instanceof TypeError && directErr.message.includes("fetch")) {
      throw new Error(
        "CORS blocked. In Apps Script: Deploy → Manage deployments → Who has access: Anyone (not restricted to rkd.in)."
      );
    }
    throw directErr;
  }
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

  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Topbar
          title="Analytics Dashboard"
          subtitle="Live production tracker — Bathmat Tufting"
          lastUpdated={lastUpdated}
          isLoading={isLoading}
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
              {/* Main error row */}
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

              {/* Fix instructions box */}
              <div
                style={{
                  margin: "0 16px 12px",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 6 }}>
                  🔧 Fix Steps (Apps Script Deployment):
                </div>
                <ol style={{ fontSize: 11, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>Google Sheet kholo → Extensions → Apps Script</li>
                  <li>Deploy → <strong>Manage deployments</strong> → pencil icon (Edit)</li>
                  <li><strong>Who has access</strong> → <strong>Anyone</strong> (NOT &quot;Anyone with Google account&quot; or domain)</li>
                  <li>New version deploy karo → URL copy karo</li>
                  <li>Vercel → Environment Variables → <code style={{ background: "rgba(239,68,68,0.15)", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace" }}>NEXT_PUBLIC_APPS_SCRIPT_URL</code> update karo</li>
                  <li>Vercel pe Redeploy karo</li>
                </ol>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && !data && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", borderRadius: 10, marginBottom: 20,
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <Database size={14} color="#6366f1" />
              <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 500 }}>
                Connecting to Google Sheet... (trying proxy → direct)
              </span>
            </div>
          )}

          {/* Stat Cards */}
          <StatCards stats={stats} isLoading={isLoading} />

          {/* Charts */}
          <div style={{ marginTop: 20 }}>
            <ChartsRow stats={stats} isLoading={isLoading} />
          </div>

          {/* Top 5 / Bottom 5 Karigars */}
          <div style={{ marginTop: 20 }}>
            <KarigarRanking
              leaderboard={stats?.karigarLeaderboard ?? []}
              isLoading={isLoading}
            />
          </div>

          {/* Filters + Table */}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: "12px 16px",
                marginBottom: 16,
              }}
            >
              <FilterBar rows={processedRows} filters={filters} onFiltersChange={setFilters} />
            </div>

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

          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
}
